export class Job {
  name: string = "";
  position: string = "";
  startTime: Date | null = null;
  endTime: Date | null = null;
}

export class Education {
  name: string = "";
  level: string = "";
  startTime: Date | null = null;
  endTime: Date | null = null;
}

export class JobApplication {
  app: string = "";
  firstname: string = "";
  lastname: string = "";
  email: string = "";
  phone: number = 0; 
  resume: any;
  description: string = "";
  birthday: Date | null = null;
  adress: string = "";
  jobs: Job[] = [];
  educations: Education[] = [];
}
