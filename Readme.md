# Cue-Me-In

This `@lpezet/cue-me-in` library helps the `@lpezet/cue-me-in-cli` command line interface monitoring things and alerting user of changes.

This library makes it eas to fetch things (WHAT) and evaluate expressions against it (HOW) to generate a state from it.
Changes in state could then be tracked to provide notifications (out of scope in this project).

## Installation

### Node Package

```bash
npm install @lpezet/cue-me-in
```

## Cue-Me-In Model

The main class provides a class and builder to start monitoring the state of remote programs or content.
It looks like something like this:

```js
const cue = CMI.builder()
  .what("https://www.example.com/something/json")
  .transform({
    transform(input: Response): Promise<any> {
      switch (input.contentType) {
        case "application/json":
          return Promise.resolve(JSON.parse(input.body || "{}"));
        case "text/html":
          return Promise.resolve(input.body);
      }
      return Promise.reject(
        new Error(
          "HTTP Response with content-type={input.contentType} not supported."
        )
      );
    }
  })
  .how("jmespath:wus")
  .build();
```

The CMI Builder and CMI Class takes 3 main properties:

- `what`: The actual remote content/software we want to monitor here. This could be a web page or json (e.g. https://www.google.com) or a local process (e.g. ps in Linux). Mods, called Extraction Mods, are used to process the different possible values (e.g. httpMod is used to handle "http(s)" values).
- `transform`: A way to transform the results from **what** to be processed by the **how** below.
- `how`: How to process the remote content/process to generate a _state_. For example, we could be monitoring changes in the _h1_ of a web page, or the _wus_ field of a JSON result. Mods, called Evaluation Mods, are used to provide different languages to process content. For example, cheerioMod is used to load cheerio.js to run jquery-like queries.

## Extraction Mods (WHAT)

### Interface

The Extraction Mod interface is as follows:

```js
export interface Mod {
  fetch: () => Promise<any>;
}
```

### HTTP

The HTTP Extraction Mod will simply fetch urls using standard _http_/_https_ NodeJS packages.

This Mod returns a _Promise_ with a result of type **Response**:

```js
export interface Response {
  aborted: boolean;
  httpVersion: string;
  httpVersionMajor: number;
  httpVersionMinor: number;
  headers: http.IncomingHttpHeaders;
  rawHeaders: string[];
  contentType?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  statusMessage?: string;
  body?: string;
}
```

This interface is very similar to the _http.IncomingMessage_ interface with few additions:

- `contentType`: shortcut to access the Content-type header value.
- `body`: convenient way to get the body of the response.

### PS

The job of this mod is to get information of a local process.
Only Linux/Mac is supported at the moment.
It calls **ps** and parses the results as an array of key/value string pair (strong-type interface coming soon).

## Transformation Mods (TRANSFORM)

The job of this mod is to simply transform the result from `what` into something that can be processed by the `how`.

### Interface

```js
export interface Mod<I, O> {
  transform: (input: I) => Promise<O>;
}
```

## Evaluation Mods (HOW)

### Interface

All Evaluation Mods follows this interface:

```js
export interface Mod {
  eval: (input: any) => Promise<string>;
}
```

### Cheerio

This mods leverages the **cheerio** NodeJS package to evaluate content.

### JmesPath

THis mods leverages the **jmesPath** NodeJS package to query json content.

## Examples

### Monitor the Work Unit Count of the team Tom's Hardware on Folding@Home

```js
const cue = CMI.builder()
  .what("https://stats.foldingathome.org/api/team/40051")
  .transform(Json)
  .how("jmespath:wus")
  .build();
```

### Monitor local process with pid 123

```js
const options: CMIOptions = {
  what: new PsMod({ pid: 342 }),
  transform: {
    transform(input: PsData[]): Promise<{}> {
      return Promise.resolve(input[0] || {});
    }
  },
  how: new JmesPath("jmespath:pid")
};
const cue = new CMIClass(options);
```
