// Reads a whole-number flag like --games=1000 from the command line.
export function readNumberFlag(name: string, fallback: number): number {
  const flag = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  const value = flag ? Number(flag.split("=")[1]) : fallback;

  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`--${name} must be a whole number of at least 1.`);
  }

  return value;
}

// Reads a text flag like --compare=sector-swap, or null when it isn't given.
export function readTextFlag(name: string): string | null {
  const flag = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return flag ? flag.slice(name.length + 3) : null;
}

// Prints rows as a plain-text table with each column padded to its widest cell.
export function printTable(headers: string[], rows: string[][]) {
  const widths = headers.map((header, index) => Math.max(header.length, ...rows.map((row) => row[index].length)));
  const formatLine = (line: string[]) => line.map((cell, index) => cell.padEnd(widths[index])).join("  ");

  console.log(formatLine(headers));
  rows.forEach((row) => console.log(formatLine(row)));
}
