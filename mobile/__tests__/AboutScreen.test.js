const fs = require('fs');
const path = require('path');

test('AboutScreen file exists', () => {
  const file = path.join(__dirname, '..', 'AboutScreen.js');
  expect(fs.existsSync(file)).toBe(true);
});
