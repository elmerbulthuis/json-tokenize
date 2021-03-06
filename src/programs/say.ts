import * as program from "commander";

program.
    command("say").
    option("--message <string>", "What should I say?", String).
    action(programAction);

interface ActionConfig {
    message: string;
}
async function programAction({
    message,
}: ActionConfig) {

    console.log(message);
}
