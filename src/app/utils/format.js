import { format, parseISO } from "date-fns";

export function newConvertDate(data, formato) {
    let date = data;
    switch (formato) {
      case 'br':
        date = format(parseISO(date), 'dd/MM/yyyy', { locale: pt });
        break;
      case 'eua':
        if (!(date instanceof Date)) {
          date = parse(date, 'dd/MM/yyyy', new Date());
        }
        date = format(date, 'yyyy-MM-dd');
        break;
      default:
        date = new Date(`${date}T00:00:00-03:00`);
        break;
    }
    return date;
  }
