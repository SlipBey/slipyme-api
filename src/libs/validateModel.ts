export const validateModel = <T extends object>(data: Partial<T>, model: new () => T) => {
    const instance = new model();
    const requiredFields: (keyof T)[] = Object.keys(instance).filter(
      key => instance[key as keyof T] !== undefined
    ) as (keyof T)[];
  
    const missingFields = requiredFields.filter(field => !data[field]);
    return missingFields;
  };
  