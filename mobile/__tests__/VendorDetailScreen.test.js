const fs = require('fs');
const path = require('path');

test('VendorDetailScreen file exists', () => {
  const file = path.join(__dirname, '..', 'VendorDetailScreen.js');
  expect(fs.existsSync(file)).toBe(true);
});
