import * as test from "tape-promise/tape";
import { jsonTokenizer, Token, TokenType } from "./json-tokenizer";

test("object", async t => {
    t.deepEqual(
        await toTokenList("{}{}"),
        [
            { type: TokenType.ObjectOpen, value: "{" },
            { type: TokenType.ObjectClose, value: "}" },
            { type: TokenType.ObjectOpen, value: "{" },
            { type: TokenType.ObjectClose, value: "}" },
        ],
    );

});

test("array", async t => {
    t.deepEqual(
        await toTokenList("[][]"),
        [
            { type: TokenType.ArrayOpen, value: "[" },
            { type: TokenType.ArrayClose, value: "]" },
            { type: TokenType.ArrayOpen, value: "[" },
            { type: TokenType.ArrayClose, value: "]" },
        ],
    );

});

test("nested array", async t => {
    t.deepEqual(
        await toTokenList("[[],[[]],{}]"),
        [
            { type: TokenType.ArrayOpen, value: "[" },
            { type: TokenType.ArrayOpen, value: "[" },
            { type: TokenType.ArrayClose, value: "]" },
            { type: TokenType.Comma, value: "," },
            { type: TokenType.ArrayOpen, value: "[" },
            { type: TokenType.ArrayOpen, value: "[" },
            { type: TokenType.ArrayClose, value: "]" },
            { type: TokenType.ArrayClose, value: "]" },
            { type: TokenType.Comma, value: "," },
            { type: TokenType.ObjectOpen, value: "{" },
            { type: TokenType.ObjectClose, value: "}" },
            { type: TokenType.ArrayClose, value: "]" },
        ],
    );

});

test("whitespace", async t => {
    t.deepEqual(
        await toTokenList(" {  }   "),
        [
            { type: TokenType.Whitespace, value: " " },
            { type: TokenType.ObjectOpen, value: "{" },
            { type: TokenType.Whitespace, value: "  " },
            { type: TokenType.ObjectClose, value: "}" },
            { type: TokenType.Whitespace, value: "   " },
        ],
    );

});

test("string", async t => {
    t.deepEqual(
        await toTokenList(' "a\\"bc" '),
        [
            { type: TokenType.Whitespace, value: " " },
            { type: TokenType.StringOpen, value: "\"" },
            { type: TokenType.StringChunk, value: "a\"bc" },
            { type: TokenType.StringClose, value: "\"" },
            { type: TokenType.Whitespace, value: " " },
        ],
    );

});

async function toTokenList(chunks: AsyncIterable<string> | Iterable<string>) {
    const tokens = jsonTokenizer(chunks);
    const list = new Array<Token>();
    for await (const token of tokens) {
        list.push(token);
    }
    return list;
}
