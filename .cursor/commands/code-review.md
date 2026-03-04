Comprehensive security and quality review of uncommitted changes:

Get changed files: git diff --name-only HEAD

For each changed file, check for:

Security Issues (CRITICAL):

Hardcoded credentials, API keys, tokens
SQL injection vulnerabilities
XSS vulnerabilities
Missing input validation
Insecure dependencies
Path traversal risks
Code Quality (HIGH):

Functions > 50 lines
Files > 800 lines
Nesting depth > 4 levels
Missing error handling
console.log statements
TODO/FIXME comments
Missing JSDoc for public APIs
Best Practices (MEDIUM):

Mutation patterns (use immutable instead)
Emoji usage in code/comments
Missing tests for new code
Accessibility issues (a11y)
Generate report with:

Severity: CRITICAL, HIGH, MEDIUM, LOW
File location and line numbers
Issue description
Suggested fix
Block commit if CRITICAL or HIGH issues found

Never approve code with security vulnerabilities!
