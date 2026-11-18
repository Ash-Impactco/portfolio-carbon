(() => {
  const area = { latMin: -2.85, latMax: -1.05, lonMin: 28.85, lonMax: 30.85 };
  const columns = [
    ['hh_id', 'Household'],
    ['stove_id', 'Stove'],
    ['install_date', 'Installed'],
    ['visit_date', 'Visited'],
    ['lat', 'Lat'],
    ['lon', 'Lon'],
    ['in_use', 'In use'],
    ['days_used_7', 'Days used (7)'],
    ['hh_size', 'HH size'],
    ['enumerator', 'Enumerator']
  ];
  const rows = [
    ['HH-1001', 'ST-5501', '2025-03-04', '2026-03-10', -1.952, 30.061, 'Y', 7, 5, 'E01'],
    ['HH-1002', 'ST-5502', '2025-03-04', '2026-03-10', -1.947, 30.072, 'Y', 6, 4, 'E01'],
    ['HH-1003', 'ST-5503', '2025-03-05', '2026-03-11', -2.011, 29.955, 'Y', 7, 6, 'E02'],
    ['HH-1004', 'ST-5504', '2025-03-05', '2025-02-28', -2.016, 29.961, 'Y', 5, 3, 'E02'],
    ['HH-1005', 'ST-5505', '2025-03-06', '2026-03-12', -1.731, 29.611, 'N', 4, 5, 'E03'],
    ['HH-1006', 'ST-5506', '2025-03-06', '2026-03-12', -1.729, 29.618, 'Y', 9, 7, 'E03'],
    ['HH-1007', 'ST-5503', '2025-03-07', '2026-03-12', -1.744, 29.602, 'Y', 7, 4, 'E03'],
    ['HH-1008', 'ST-5508', '2025-03-07', '2026-03-13', -1.302, 30.401, 'Y', 6, 5, 'E04'],
    ['HH-1009', 'ST-5509', '2025-03-08', '2026-03-13', 1.302, 30.401, 'Y', 7, 6, 'E04'],
    ['HH-1010', 'ST-5510', '2025-03-08', '', -1.311, 30.395, 'Y', 7, 4, 'E04'],
    ['HH-1011', 'ST-5511', '2025-03-09', '2026-03-14', -2.501, 29.741, 'Y', 3, 22, 'E05'],
    ['HH-1012', 'ST-5512', '2025-03-09', '2026-03-14', -2.497, 29.736, 'Y', 7, 5, 'E05'],
    ['HH-1003', 'ST-5513', '2025-03-10', '2026-03-15', -2.508, 29.729, 'Y', 6, 6, 'E05'],
    ['HH-1014', 'ST-5514', '2025-03-10', '2026-03-15', -2.214, 31.402, 'Y', 7, 3, 'E06'],
    ['HH-1015', 'ST-5515', '2025-03-11', '2026-03-16', -2.221, 30.411, 'Y', 0, 5, 'E06'],
    ['HH-1016', 'ST-5516', '2025-03-11', '2026-03-16', -2.219, 30.405, 'Y', 7, 0, 'E06']
  ].map(values => Object.fromEntries(columns.map(([key], i) => [key, values[i]])));

  const issues = [];
  const addIssue = (row, field, message) => issues.push({ row, field, message });
  const counts = key => rows.reduce((result, row) => {
    result[row[key]] = (result[row[key]] || 0) + 1;
    return result;
  }, {});
  const householdCounts = counts('hh_id');
  const householdsByStove = new Map();

  rows.forEach(row => {
    if (!householdsByStove.has(row.stove_id)) householdsByStove.set(row.stove_id, new Set());
    householdsByStove.get(row.stove_id).add(row.hh_id);
  });

  rows.forEach((row, i) => {
    columns.forEach(([field, label]) => {
      if (row[field] === '' || row[field] === null || row[field] === undefined) {
        addIssue(i, field, `Missing ${label.toLowerCase()}`);
      }
    });

    if (householdCounts[row.hh_id] > 1) {
      addIssue(i, 'hh_id', `Household ID ${row.hh_id} appears ${householdCounts[row.hh_id]} times`);
    }
    const stoveHouseholds = householdsByStove.get(row.stove_id);
    if (stoveHouseholds.size > 1) {
      addIssue(i, 'stove_id', `Stove ${row.stove_id} recorded at ${[...stoveHouseholds].join(' and ')}`);
    }
    if (row.visit_date && row.install_date && row.visit_date < row.install_date) {
      addIssue(i, 'visit_date', 'Visit date is before installation date');
    }
    if (typeof row.days_used_7 === 'number' && (row.days_used_7 < 0 || row.days_used_7 > 7)) {
      addIssue(i, 'days_used_7', `Days used in last 7 is ${row.days_used_7}`);
    }
    if (row.in_use === 'N' && row.days_used_7 > 0) {
      addIssue(i, 'in_use', `Marked not in use, but used ${row.days_used_7} of last 7 days`);
    }
    if (typeof row.lat === 'number' && (row.lat < area.latMin || row.lat > area.latMax)) {
      addIssue(i, 'lat', `Latitude ${row.lat} outside project area (sign error?)`);
    }
    if (typeof row.lon === 'number' && (row.lon < area.lonMin || row.lon > area.lonMax)) {
      addIssue(i, 'lon', `Longitude ${row.lon} outside project area`);
    }
    if (typeof row.hh_size === 'number' && (row.hh_size < 1 || row.hh_size > 15)) {
      addIssue(i, 'hh_size', `Household size of ${row.hh_size} is implausible`);
    }
  });

  const flaggedFields = new Map();
  issues.forEach(issue => {
    if (!flaggedFields.has(issue.row)) flaggedFields.set(issue.row, new Set());
    flaggedFields.get(issue.row).add(issue.field);
  });

  const cell = (tagName, text, className = '') => {
    const element = document.createElement(tagName);
    element.textContent = text;
    if (className) element.className = className;
    return element;
  };

  function renderSummary() {
    const summary = document.getElementById('summary');
    const flaggedCount = flaggedFields.size;
    const values = [
      [rows.length, 'survey records', ''],
      [flaggedCount, 'records flagged', 'warn'],
      [issues.length, 'issues to review', 'warn'],
      [rows.length - flaggedCount, 'records unflagged', 'ok']
    ];
    summary.replaceChildren(...values.map(([value, label, status]) => {
      const item = cell('div', '', `stat ${status}`.trim());
      item.append(cell('b', String(value)), cell('span', label));
      return item;
    }));
  }

  function renderTable(onlyFlagged) {
    const table = document.getElementById('dataTable');
    const head = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.append(cell('th', '#'));
    columns.forEach(([, label]) => headerRow.append(cell('th', label)));
    head.append(headerRow);

    const body = document.createElement('tbody');
    rows.forEach((row, i) => {
      const flagged = flaggedFields.get(i);
      if (onlyFlagged && !flagged) return;
      const tableRow = document.createElement('tr');
      if (flagged) tableRow.className = 'has-flag';
      tableRow.append(cell('td', String(i + 1), 'idx'));
      columns.forEach(([field]) => {
        const isFlagged = flagged?.has(field);
        const value = row[field] === '' ? '(blank)' : String(row[field]);
        tableRow.append(cell('td', value, isFlagged ? 'flag' : ''));
      });
      body.append(tableRow);
    });
    table.replaceChildren(head, body);
  }

  function renderIssueLog() {
    const table = document.getElementById('issueLog');
    const head = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Row', 'Household', 'Enumerator', 'Issue', 'Suggested next step'].forEach(label => {
      headerRow.append(cell('th', label));
    });
    head.append(headerRow);

    const body = document.createElement('tbody');
    issues.forEach(issue => {
      const row = rows[issue.row];
      const tableRow = document.createElement('tr');
      [
        String(issue.row + 1),
        String(row.hh_id),
        String(row.enumerator),
        issue.message,
        'Confirm with the field team before using this record'
      ].forEach(value => tableRow.append(cell('td', value)));
      body.append(tableRow);
    });
    table.replaceChildren(head, body);
  }

  renderSummary();
  renderTable(false);
  renderIssueLog();
  document.getElementById('onlyFlagged').addEventListener('change', event => {
    renderTable(event.currentTarget.checked);
  });
})();
