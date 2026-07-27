import fs from "fs";
import parser from "@babel/parser";
const code = fs.readFileSync("src/App.jsx", "utf8");
try {
  parser.parse(code, { sourceType: "module", plugins: ["jsx"] });
  console.log("Parse OK");
} catch (e) {
  console.error(e.message);
  console.error("loc", JSON.stringify(e.loc));
  process.exit(1);
}
