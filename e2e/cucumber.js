module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: ['support/world.js', 'step_definitions/**/*.js'],
    format: [
      'progress-bar',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json',
      'summary'
    ],
    formatOptions: { snippetInterface: 'async-await' },
    parallel: 1,
    timeout: 30000,
  }
};
