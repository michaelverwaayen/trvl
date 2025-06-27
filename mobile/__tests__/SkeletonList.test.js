const fs = require('fs');
const path = require('path');

test('SkeletonList file exists', () => {
  const file = path.join(__dirname, '..', 'SkeletonList.js');
  expect(fs.existsSync(file)).toBe(true);
});
