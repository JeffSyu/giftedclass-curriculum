const fs = require('fs');
let content = fs.readFileSync('src/components/Export.tsx', 'utf8');

content = content.replace(
  "return {\n      titleRow: (showTitle && titleText) ? titleText : undefined,\n      headers,\n      rows,\n      footer: showEntityName ? `${entityTypeLabel}：${entityName}` : undefined\n    };",
  "return {\n      titleRow: (showTitle && titleText) ? titleText : undefined,\n      subTitleRow: undefined as string | undefined,\n      headers,\n      rows,\n      footer: showEntityName ? `${entityTypeLabel}：${entityName}` : undefined\n    };"
);

content = content.replace(
  "const result: { title: string; filename: string; gridData: ReturnType<typeof generateGridData> }[] = [];",
  "const result: { title: string; filename: string; gridData: { titleRow?: string; subTitleRow?: string; headers: string[]; rows: string[][]; footer?: string; } }[] = [];"
);

fs.writeFileSync('src/components/Export.tsx', content);
