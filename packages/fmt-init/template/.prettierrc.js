module.exports = {
    tabWidth: 4, // tab缩进大小,默认为2
    useTabs: false, // 使用tab缩进，默认false
    semi: true, // 使用分号, 默认true
    singleQuote: true, // 使用单引号, 默认false(在jsx中配置无效, 默认都是双引号)
    quoteProps: 'as-needed', // 仅在必需时为对象的key添加引号
    jsxSingleQuote: false, // jsx中是否使用单引号, 默认false
    trailingComma: 'none', // 多行时尽可能打印尾随逗号，none|es5|all
    bracketSpacing: true, // 对象中的空格 默认true
    arrowParens: 'avoid', // 只有一个参数的箭头函数的参数是否带圆括号（默认avoid不带）
    vueIndentScriptAndStyle: false, // vue文件中的script和style标签是否缩进
    endOfLine: 'lf', // 结尾是 \n \r \n\r auto
    singleAttributePerLine: false, // 多个属性是否每行一个
    printWidth: 240, // 换行字符串阈值
    bracketSameLine: false // 大括号是否与标识符在同一行
};
