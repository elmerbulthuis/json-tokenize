# JSON tokenizer
Streaming, environment agnostic JSON tokenizer.

Based on https://www.json.org/json-en.html

This tokenizer has no dependencies and is completely environment agnostic! So it will ru in your browser and in node. This makes is a good choice when building applications that need to run on any enviromnent.

The tokenizer takes a stream (as an `Iterable` or `AsyncIterable`) of strings and outputs a stream (as `AsyncIterable`) of tokens. Tokenization is completely asynchronous! This makes this tokenizer suitable for large files or real time event parsing.

This component is built in typescript and types are included in the distribution. Install it and, if you are using typescript, enjoy the types!

Usage (also checkout the tests):

```typescript
// Read a file
const stream = fs.createReadStream("package.json", "utf8");
// Create a stream of tokens
const tokens = tokenize(stream);

// let's count some objects!
let objectCount = 0;
for await (const token of tokens) {
    if (token.type === TokenType.ObjectOpen) {
        objectCount++;
    }
}
console.log(`found ${objectCount} objects`);
```
