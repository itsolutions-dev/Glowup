export interface workOrder {
  id: string;
  title: string;
  description: string;
  status: number;
  orderStartDate: Date;
  orderEndDate?: Date;
  companyId: string;
}
