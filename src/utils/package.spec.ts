import * as test from "tape-promise/tape";
import { packageName, packageInfo } from "./package";

test("package name", async t => {
    t.equal(packageName, "tsprimer");
});

test("package version", async t => {
    t.notOk(packageInfo.version, undefined);
});
