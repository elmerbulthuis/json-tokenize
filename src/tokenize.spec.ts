import * as fs from "fs";
import * as test from "tape-promise/tape";
import { Token, TokenType } from "./token";
import { tokenize } from "./tokenize";

readPackage();

async function readPackage() {
    const stream = fs.createReadStream("package.json", "utf8");
    const tokens = tokenize(stream);
    let objectCount = 0;
    for await (const token of tokens) {
        if (token.type === TokenType.ObjectOpen) {
            objectCount++;
        }
    }
    console.log(`found ${objectCount} objects`);
}

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
        await toTokenList(' "a\\"bc" "\\u1234\\uffff" '),
        [
            { type: TokenType.Whitespace, value: " " },
            { type: TokenType.StringOpen, value: "\"" },
            { type: TokenType.StringChunk, value: "a\"bc" },
            { type: TokenType.StringClose, value: "\"" },
            { type: TokenType.Whitespace, value: " " },
            { type: TokenType.StringOpen, value: "\"" },
            { type: TokenType.StringChunk, value: "\u1234\uffff" },
            { type: TokenType.StringClose, value: "\"" },
            { type: TokenType.Whitespace, value: " " },
        ],
    );

});

test("keyword", async t => {
    t.deepEqual(
        await toTokenList(' false  true  null '),
        [
            { type: TokenType.Whitespace, value: " " },
            { type: TokenType.False, value: "false" },
            { type: TokenType.Whitespace, value: "  " },
            { type: TokenType.True, value: "true" },
            { type: TokenType.Whitespace, value: "  " },
            { type: TokenType.Null, value: "null" },
            { type: TokenType.Whitespace, value: " " },
        ],
    );
});

test("object with members", async t => {
    t.deepEqual(
        await toTokenList('{"a":true}'),
        [
            { type: TokenType.ObjectOpen, value: "{" },
            { type: TokenType.StringOpen, value: "\"" },
            { type: TokenType.StringChunk, value: "a" },
            { type: TokenType.StringClose, value: "\"" },
            { type: TokenType.Colon, value: ":" },
            { type: TokenType.True, value: "true" },
            { type: TokenType.ObjectClose, value: "}" },
        ],
    );
});

test("number", async t => {
    t.deepEqual(
        await toTokenList("10 -2 -000.1 10e2 10E-2"),
        [
            { type: TokenType.Number, value: "10" },
            { type: TokenType.Whitespace, value: " " },
            { type: TokenType.Number, value: "-2" },
            { type: TokenType.Whitespace, value: " " },
            { type: TokenType.Number, value: "-0" },
            { type: TokenType.Number, value: "0" },
            { type: TokenType.Number, value: "0.1" },
            { type: TokenType.Whitespace, value: " " },
            { type: TokenType.Number, value: "10e2" },
            { type: TokenType.Whitespace, value: " " },
            { type: TokenType.Number, value: "10E-2" },
        ],
    );
});

async function toTokenList(chunks: AsyncIterable<string> | Iterable<string>) {
    const tokens = tokenize(chunks);
    const list = new Array<Token>();
    for await (const token of tokens) {
        list.push(token);
    }
    return list;
}
