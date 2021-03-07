# Tokenize JSON
Streaming, environment agnostic JSON tokenizer.

Based on https://www.json.org/json-en.html

This tokenizer has no dependencies and is completely environment agnostic! So it will ru in your browser and in node. This makes is a good choice when building applications that need to run on any enviromnent.

The tokenizer takes a stream (as an `Iterable` or `AsyncIterable`) of strings and outputs a stream (as `AsyncIterable`) of tokens. Tokenization is completely asynchronous! This makes this tokenizer suitable for large files or real time event parsing.

This component is built in typescript and types are included in the distribution. Install it and, if you are using typescript, enjoy the types!

Usage (also checkout the tests) in node:

```typescript
// TODO: test this!

async function countObjects(file: string) {
    // Read a file (could be a very big file)
    const stream = fs.createReadStream(file, "utf8");
    // Create a stream of tokens
    const tokens = tokenize(stream);

    // let's count some objects!
    let objectCount = 0;
    for await (const token of tokens) {
        if (token.type === TokenType.ObjectOpen) {
            objectCount++;
        }
    }
    return objectCount;
}

```

Example in browser:
```typescript
// TODO: test this!

async function countObjects(url: URL) {
    // open a stream
    const response = fetch(url);
    // Create a stream of tokens
    const tokens = tokenize(readResponseBody(response.stream));

    // let's count some objects!
    let objectCount = 0;
    for await (const token of tokens) {
        if (token.type === TokenType.ObjectOpen) {
            objectCount++;
        }
    }
    return objectCount;
}

async function* readResponseBody(stream: ReadableStream<Uint8Array>) {
    const decoder = new TextDecoder();
    const reader = stream.getReader();
    try {
        let result = await reader.read();
        while (!result.done) {
            yield decoder.decode(result.value, { stream: true });
            result = await reader.read();
        }
    }
    finally {
        reader.releaseLock();
    }
}

```

You could also tokenize an iterable of strings. So that could be an array of strings, but a string itself is also an iterable of strings!

```typescript
// TODO: test me

async function countObjects(texts: Iterable<string>) {
    const tokens = tokenize(texts);

    // let's count some objects!
    let objectCount = 0;
    for await (const token of tokens) {
        if (token.type === TokenType.ObjectOpen) {
            objectCount++;
        }
    }
    return objectCount;
}
```