module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'refactor', 'test', 'style', 'chore']],
    'header-max-length': [2, 'always', 50],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
  },
};
