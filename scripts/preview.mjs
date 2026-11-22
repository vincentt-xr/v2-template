/**
 * `pnpm preview` is retired along with the laptop preview. The script keeps its
 * name so an old habit gets an answer instead of a missing-script error, and it
 * prints the same redirect the CLI prints for `vincentt preview`. It spawns
 * nothing and makes no network call.
 */
const lines = [
  "✗ `vincentt preview` was retired. Laptop preview no longer exists.",
  "",
  "  To try the app on a phone:   vincentt build, then vincentt test-link",
  "  To see the project, its preview and its comments: open the project in the console.",
  "  To read what testers sent:   vincentt feedback --wait",
];

for (const line of lines) console.error(line);
process.exit(1);
