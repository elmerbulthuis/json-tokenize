import * as assert from "assert";

// see https://www.json.org/json-en.html

export enum TokenType {
    Whitespace,
    ObjectOpen, ObjectClose,
    ArrayOpen, ArrayClose,
    StringOpen, StringClose, StringChunk,
    NumberValue, KeywordValue,
    Comma, Colon,
}

export interface Token {
    type: TokenType,
    value: string,
}

export interface JsonTokenizerOptions {
    bufferSize?: number;
}
export const defaultJsonTokenizerOptions = {
    bufferSize: 1024,
};

export async function* jsonTokenizer(
    chunks: AsyncIterable<string> | Iterable<string>,
    options: JsonTokenizerOptions = {},
): AsyncIterable<Token> {
    const {
        bufferSize,
    } = {
        ...defaultJsonTokenizerOptions,
        ...options,
    };

    const chars = readChars(chunks);
    const char = chars[Symbol.asyncIterator]();

    let current = await char.next();
    while (!current.done) {
        switch (current.value) {
            case " ":
                yield* emitWhitespace();
                break;

            case "{":
                yield* emitObject();
                break;

            case "[":
                yield* emitArray();
                break;

            case "\"":
                yield* emitString();
                break;

            default: assert.fail();
        }
    }

    async function* emitObject(): AsyncIterable<Token> {
        assert(!current.done);
        assert(current.value === "{");

        yield {
            type: TokenType.ObjectOpen,
            value: current.value,
        };

        current = await char.next();
        assert(!current.done);

        while (current.value !== "}") {
            switch (current.value) {
                case " ":
                    yield* emitWhitespace();
                    break;
            }
        }

        yield {
            type: TokenType.ObjectClose,
            value: current.value,
        };

        current = await char.next();
    }

    async function* emitArray(): AsyncIterable<Token> {
        assert(!current.done);
        assert(current.value === "[");

        yield {
            type: TokenType.ArrayOpen,
            value: current.value,
        };

        current = await char.next();
        assert(!current.done);

        while (current.value !== "]") {
            switch (current.value) {
                case ",":
                    yield {
                        type: TokenType.Comma,
                        value: current.value,
                    };
                    current = await char.next();
                    assert(!current.done);
                    break;

                case " ":
                    yield* emitWhitespace();
                    break;

                case "{":
                    yield* emitObject();
                    break;

                case "[":
                    yield* emitArray();
                    break;

                case "\"":
                    yield* emitString();
                    break;
            }
        }

        yield {
            type: TokenType.ArrayClose,
            value: current.value,
        };

        current = await char.next();
    }

    async function* emitWhitespace(): AsyncIterable<Token> {
        assert(!current.done);
        assert(current.value === " ");

        let buffer = current.value;
        current = await char.next();
        while (!current.done && current.value === " ") {
            buffer += current.value;
            current = await char.next();
        }

        yield {
            type: TokenType.Whitespace,
            value: buffer,
        };
    }

    async function* emitString(): AsyncIterable<Token> {
        assert(!current.done);
        assert(current.value === "\"");

        yield {
            type: TokenType.StringOpen,
            value: current.value,
        };

        current = await char.next();
        assert(!current.done);
        let buffer = "";
        while (current.value !== "\"") {
            if (current.value === "\\") {
                current = await char.next();
                assert(!current.done);

                switch (current.value) {
                    case "\"":
                        buffer += "\"";
                        break;
                }
            }
            else {
                buffer += current.value;
            }

            if (buffer.length >= bufferSize) {
                yield {
                    type: TokenType.StringChunk,
                    value: buffer,
                };
                buffer = "";
            }

            current = await char.next();
            assert(!current.done);
        }

        if (buffer.length > 0) {
            yield {
                type: TokenType.StringChunk,
                value: buffer,
            };
        }

        yield {
            type: TokenType.StringClose,
            value: current.value,
        };

        current = await char.next();
    }
}

//#region helpers

async function* readChars(chunks: AsyncIterable<string> | Iterable<string>) {
    for await (const chunk of chunks) {
        yield* chunk;
    }
}

//#endregion
