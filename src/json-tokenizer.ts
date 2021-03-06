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
        yield* emitWhitespace();
        while (!current.done) {
            yield* emitValue();
            yield* emitWhitespace();
        }
    }

    async function* emitValue(): AsyncIterable<Token> {
        // TODO: syntaxerror
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

            // TODO: proper number support
            case "-":
                yield* emitNumber();
                break;

            default:
                // TODO: proper number support
                if (isNumeric(current.value)) {
                    yield* emitNumber();
                    break;
                }
                if (isLowerAlpha(current.value)) {
                    yield* emitKeyword();
                    break;
                }
                // TODO: syntaxerror
                assert.fail();
        }
    }

    async function* emitObject(): AsyncIterable<Token> {
        // TODO: syntaxerror
        assert(!current.done);
        // TODO: syntaxerror
        assert(current.value === "{");

        yield {
            type: TokenType.ObjectOpen,
            value: current.value,
        };
        current = await char.next();
        // TODO: syntaxerror
        assert(!current.done);

        let expectComma = false;
        yield* emitWhitespace();
        while (current.value !== "}") {
            if (expectComma) {
                yield* emitComma();
                yield* emitWhitespace();
            }
            else {
                yield* emitString();
                yield* emitWhitespace();
                yield* emitColon();
                yield* emitWhitespace();
                yield* emitValue();
                yield* emitWhitespace();
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
        // TODO: syntaxerror
        assert(!current.done);
        // TODO: syntaxerror
        assert(current.value === "[");

        yield {
            type: TokenType.ArrayOpen,
            value: current.value,
        };
        current = await char.next();
        // TODO: syntaxerror
        assert(!current.done);

        let expectComma = false;
        yield* emitWhitespace();
        while (current.value !== "]") {
            if (expectComma) {
                yield* emitComma();
                yield* emitWhitespace();
            }
            else {
                yield* emitValue();
                yield* emitWhitespace();
            }
            expectComma = !expectComma;
        }

        yield {
            type: TokenType.ArrayClose,
            value: current.value,
        };
        current = await char.next();
    }

    async function* emitString(): AsyncIterable<Token> {
        // TODO: syntaxerror
        assert(!current.done);
        // TODO: syntaxerror
        assert(current.value === "\"");

        yield {
            type: TokenType.StringOpen,
            value: current.value,
        };
        current = await char.next();
        // TODO: syntaxerror
        assert(!current.done);

        let buffer = "";
        while (current.value !== "\"") {
            if (current.value === "\\") {
                current = await char.next();
                // TODO: syntaxerror
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
            // TODO: syntaxerror
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

    // TODO: support fractions, exponents
    async function* emitNumber(): AsyncIterable<Token> {
        // TODO: syntaxerror
        assert(!current.done);
        // TODO: syntaxerror
        assert(current.value === "-" || isNumeric(current.value));

        let buffer = current.value;
        current = await char.next();
        while (!current.done && isNumeric(current.value)) {
            buffer += current.value;
            current = await char.next();
        }

        yield {
            type: TokenType.Number,
            value: buffer,
        };

    }

    async function* emitKeyword(): AsyncIterable<Token> {
        // TODO: syntaxerror
        assert(!current.done);
        // TODO: syntaxerror
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

            // TODO: syntaxerror
            default: assert.fail();
        }
    }

    async function* emitWhitespace(): AsyncIterable<Token> {
        let buffer = "";
        while (!current.done && isWhitespace(current.value)) {
            buffer += current.value;
            current = await char.next();
        }

        if (buffer.length > 0) yield {
            type: TokenType.Whitespace,
            value: buffer,
        };
    }

    async function* emitComma(): AsyncIterable<Token> {
        // TODO: syntaxerror
        assert(!current.done);
        // TODO: syntaxerror
        assert(current.value === ",");

        yield {
            type: TokenType.Comma,
            value: current.value,
        };
        current = await char.next();
        // TODO: syntaxerror
        assert(!current.done);
    }

    async function* emitColon(): AsyncIterable<Token> {
        // TODO: syntaxerror
        assert(!current.done);
        // TODO: syntaxerror
        assert(current.value === ":");

        yield {
            type: TokenType.Colon,
            value: current.value,
        };
        current = await char.next();
        // TODO: syntaxerror
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
    return (
        char === "\u0020" || // space
        char === "\u000A" || // line feed
        char === "\u000D" || // carriage return
        char === "\u0009" // horizontal tab
    );
}

function isNumeric(char: string) {
    return char >= "0" && char <= "9";
}

//#endregion
