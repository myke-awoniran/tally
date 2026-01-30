import {Elysia} from "elysia";
import {mainLoop} from "./cli/repl";

const app = new Elysia().get("/", () => "Hello Elysia").listen(3000);
await mainLoop();