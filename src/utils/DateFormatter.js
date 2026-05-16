export default class DateFormatter {
  dateAndTimeTemplate = (input) => {
    const date = new Date(input);

    // Helper for 1st, 2nd, 3rd, 4th...
    const getOrdinal = (n) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    // Formatting parts
    const dayWithSuffix = getOrdinal(date.getDate());
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    let time = date
      .toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
      .toUpperCase(); // Ensures PM/AM is uppercase

    // Final Result
    const finalString = `${dayWithSuffix} ${month} ${year}, ${time}`;

    return finalString;
  };

  dateTemplate = (input) => {
    if (input === null) {
      return null;
    }

    const date = new Date(input);
    const getOrdinal = (n) => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    // Formatting parts
    const dayWithSuffix = getOrdinal(date.getDate());
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    let time = date
      .toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
      .toUpperCase(); // Ensures PM/AM is uppercase

    // Final Result
    const finalString = `${dayWithSuffix} ${month} ${year}`;

    return finalString;
  };
}
