export type CourseMode = {
  id: number;
  name: string;
  value: string;
  active: boolean;
};

export type Location = {
  id: number;
  name: string;
  value: string;
  is_active: boolean;
};

export type Course = {
  id: number;
  course_name: string;
  course_fee: string;
  course_fee_discount: string;
  admission_fee: string;
  is_active: boolean;

  course_mode: number[];
  course_mode_details: CourseMode[];

  locations: number[];
  location_details: Location[];
};
