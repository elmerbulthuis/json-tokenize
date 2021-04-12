import * as fs from "fs";
import * as path from "path";
import { tokenize } from "./tokenize";

measure(10);

async function measure(iterations: number) {
    console.log(`${iterations} cycles`);

    console.time();

    const stream = fs.createReadStream(path.join("fixtures", "frankfurt.json"), "utf8");
    for await (const token of tokenize(stream)) {
        //
    }

    console.timeEnd();
}
