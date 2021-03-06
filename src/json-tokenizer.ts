import * as assert from "assert";

// see https://www.json.org/json-en.html

export enum TokenType {
    Whitespace,
    ObjectOpen, ObjectClose,
    ArrayOpen, ArrayClose,
    StringOpen, StringClose, StringChunk,
    Number, True, False, Null,
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

// eslint-disable-next-line complexity
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
    yield* emitRoot();

    async function* emitRoot(): AsyncIterable<Token> {
        while (!current.done) {
            yield* emitValueOrWhitespace();
        }
    }

    async function* emitValueOrWhitespace(): AsyncIterable<Token> {
        assert(!current.done);

        switch (current.value) {
            case "{":
                yield* emitObject();
                break;

            case "[":
                yield* emitArray();
                break;

            case "\"":
                yield* emitString();
                break;

            default:
                if (isLowerAlpha(current.value)) {
                    yield* emitKeyword();
                    break;
                }
                if (isWhitespace(current.value)) {
                    yield* emitWhitespace();
                    break;
                }
                assert.fail();
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

        let expectComma = false;
        while (current.value !== "}") {
            if (expectComma) switch (current.value) {
                case ",":
                    yield* emitComma();
                    break;

                default:
                    if (isWhitespace(current.value)) {
                        yield* emitWhitespace();
                        break;
                    }
                    assert.fail();
            }
            else switch (current.value) {
                case "\"":
                    yield* emitString();

                    switch (current.value as string) {
                        case ":":
                            yield* emitColon();
                            break;

                        default:
                            if (isWhitespace(current.value)) {
                                yield* emitWhitespace();
                                break;
                            }
                            assert.fail();
                    }

                    yield* emitValueOrWhitespace();
                    break;

                default:
                    if (isWhitespace(current.value)) {
                        yield* emitWhitespace();
                        break;
                    }
                    assert.fail();
            }

            expectComma = !expectComma;
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

        let expectComma = false;
        while (current.value !== "]") {
            if (expectComma) switch (current.value) {
                case ",":
                    yield* emitComma();
                    break;

                default:
                    if (isWhitespace(current.value)) {
                        yield* emitWhitespace();
                        break;
                    }
                    assert.fail();
            }
            else yield* emitValueOrWhitespace();

            expectComma = !expectComma;
        }

        yield {
            type: TokenType.ArrayClose,
            value: current.value,
        };
        current = await char.next();
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

    async function* emitKeyword(): AsyncIterable<Token> {
        assert(!current.done);
        assert(isLowerAlpha(current.value));

        let buffer = current.value;
        current = await char.next();
        while (!current.done && isLowerAlpha(current.value)) {
            buffer += current.value;
            current = await char.next();
        }

        switch (buffer) {
            case "true":
                yield {
                    type: TokenType.True,
                    value: buffer,
                };
                break;

            case "false":
                yield {
                    type: TokenType.False,
                    value: buffer,
                };
                break;

            case "null":
                yield {
                    type: TokenType.Null,
                    value: buffer,
                };
                break;

            default: assert.fail();
        }
    }

    async function* emitWhitespace(): AsyncIterable<Token> {
        assert(!current.done);
        assert(isWhitespace(current.value));

        let buffer = current.value;
        current = await char.next();
        while (!current.done && isWhitespace(current.value)) {
            buffer += current.value;
            current = await char.next();
        }

        yield {
            type: TokenType.Whitespace,
            value: buffer,
        };
    }

    async function* emitComma(): AsyncIterable<Token> {
        assert(!current.done);
        assert(current.value === ",");

        yield {
            type: TokenType.Comma,
            value: current.value,
        };
        current = await char.next();
        assert(!current.done);
    }

    async function* emitColon(): AsyncIterable<Token> {
        assert(!current.done);
        assert(current.value === ":");

        yield {
            type: TokenType.Colon,
            value: current.value,
        };
        current = await char.next();
        assert(!current.done);
    }

}

//#region helpers

async function* readChars(chunks: AsyncIterable<string> | Iterable<string>) {
    for await (const chunk of chunks) {
        yield* chunk;
    }
}

function isLowerAlpha(char: string) {
    return char >= "a" && char <= "z";
}

function isWhitespace(char: string) {
    return char === " ";
}

//#endregion
