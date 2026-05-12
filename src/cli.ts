export function main() {
  const command = process.argv[2] ?? "help";

  if (command === "help" || command === "--help" || command === "-h") {
    console.log("CRM Simulator CLI");
    console.log("");
    console.log("Planned commands:");
    console.log("  generate");
    console.log("  validate");
    console.log("  seed-local");
    console.log("  push-pipedrive");
    console.log("  advance");
    return;
  }

  console.error(`Command not implemented yet: ${command}`);
  process.exitCode = 1;
}

main();
