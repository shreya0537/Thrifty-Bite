const fs = require("fs");
const path = require("path");

const { menuData } = require("./seedMenu");
const { renderIconSvg, slugify } = require("./utils/foodIcon");

const OUT_DIR = path.join(__dirname, "..", "frontend", "images", "dishes");

if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

let count = 0;

menuData.forEach((item) => {
    const slug = slugify(item.name);
    const content = renderIconSvg(item.name, item.category);
    fs.writeFileSync(path.join(OUT_DIR, slug + ".svg"), content);
    count++;
});

console.log(`Generated ${count} dish icons in ${OUT_DIR}`);
