// 测试自适应宽度算法的简单脚本
console.log("测试自适应宽度算法");

// 模拟不同长度的任务摘要
const testSummaries = [
  "短任务",
  "这是一个中等长度的任务描述",
  "这是一个非常长的任务描述，包含很多文字内容，需要测试自适应宽度功能",
  "This is a short task in English",
  "This is a much longer task description in English that should test the adaptive width algorithm",
  "混合中英文Mixed Chinese and English task description for testing 自适应宽度",
  "1234567890123456789012345678901234567890", // 纯数字
  "这是一段包含很多中文字符的非常长的任务描述，需要测试自适应宽度和省略号显示功能，确保当宽度和高度都达到上限时能正确显示省略号"
];

// 模拟汉字数量计算
function countChineseChars(text) {
  return (text.match(/[\u4e00-\u9fff]/g) || []).length;
}

// 模拟宽度计算（简化版）
function simulateWidthCalculation(text) {
  const chineseChars = countChineseChars(text);
  const otherChars = text.length - chineseChars;
  
  // 简化的宽度计算
  const textWidth = chineseChars * 14 + otherChars * 7;
  
  // 最小和最大宽度（基于7-15个汉字）
  const minChineseWidth = 7 * 14; // 最小7个汉字宽度
  const maxChineseWidth = 15 * 14; // 最大15个汉字宽度
  
  // 目标宽度（在最小和最大之间）
  const targetTextWidth = Math.min(maxChineseWidth, Math.max(minChineseWidth, textWidth));
  
  return {
    text,
    chineseChars,
    otherChars,
    textWidth,
    minChineseWidth,
    maxChineseWidth,
    targetTextWidth,
    widthAtMaxLimit: chineseChars > 15 || textWidth > maxChineseWidth,
    needsTruncation: chineseChars > 15 // 简化的截断判断
  };
}

console.log("测试结果:");
console.log("=".repeat(80));

testSummaries.forEach((summary, index) => {
  const result = simulateWidthCalculation(summary);
  console.log(`测试 ${index + 1}: "${summary.substring(0, 30)}${summary.length > 30 ? '...' : ''}"`);
  console.log(`  长度: ${summary.length} 字符, 汉字: ${result.chineseChars}, 其他: ${result.otherChars}`);
  console.log(`  文本宽度需求: ${result.textWidth}px`);
  console.log(`  最小宽度(7汉字): ${result.minChineseWidth}px, 最大宽度(15汉字): ${result.maxChineseWidth}px`);
  console.log(`  目标宽度: ${result.targetTextWidth}px`);
  console.log(`  宽度是否达到上限: ${result.widthAtMaxLimit ? '是' : '否'}`);
  console.log(`  是否需要截断: ${result.needsTruncation ? '是' : '否'}`);
  console.log("-".repeat(80));
});

console.log("\n实现的功能总结:");
console.log("1. 自适应宽度算法: 根据文本内容（中英文混合）计算节点宽度");
console.log("2. 宽度范围: 最小7个汉字宽度，最大15个汉字宽度");
console.log("3. 宽高比: 尽可能维持3:2的宽高比");
console.log("4. 省略号显示: 当宽度和高度都达到上限时显示省略号");
console.log("5. CSS样式: 添加了.truncated类实现文本截断");