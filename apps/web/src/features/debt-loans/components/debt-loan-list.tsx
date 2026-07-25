import { DebtLoanListItem, type DebtLoanListItemProps } from "./debt-loan-list-item";

export type DebtLoanListProps = {
  data?: DebtLoanListItemProps[];
};

export const DebtLoanListLoader = () => {
  return Array.from({ length: 4 }).map((_, index) => (
    <div key={index} className="h-28 animate-pulse rounded-lg bg-muted" />
  ));
};

export const DebtLoanList = ({ data = [] }: DebtLoanListProps) => {
  return data.map(debtLoan => <DebtLoanListItem key={debtLoan.id} {...debtLoan} />);
};
