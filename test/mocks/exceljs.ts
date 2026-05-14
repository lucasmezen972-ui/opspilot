class Worksheet {
  columns: any[] = [];
  addRow(_row: any) {}
}

class Workbook {
  addWorksheet(_name: string) {
    return new Worksheet();
  }
  xlsx = {
    async writeBuffer() {
      return new Uint8Array([1]).buffer;
    },
  };
}

export default {
  Workbook,
};
