import React from 'react';
interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}
export const Table: React.FC<TableProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full overflow-auto border border-gray-200 rounded-lg">
      <table
        className={`w-full text-sm text-left text-gray-500 ${className}`}
        {...props}>

        {children}
      </table>
    </div>);

};
export const TableHeader: React.FC<
  React.HTMLAttributes<HTMLTableSectionElement>> =
({ children, className = '', ...props }) => {
  return (
    <thead
      className={`text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200 ${className}`}
      {...props}>

      {children}
    </thead>);

};
export const TableBody: React.FC<
  React.HTMLAttributes<HTMLTableSectionElement>> =
({ children, className = '', ...props }) => {
  return (
    <tbody className={`divide-y divide-gray-200 ${className}`} {...props}>
      {children}
    </tbody>);

};
export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <tr
      className={`bg-white hover:bg-gray-50 transition-colors ${className}`}
      {...props}>

      {children}
    </tr>);

};
export const TableHead: React.FC<
  React.ThHTMLAttributes<HTMLTableCellElement>> =
({ children, className = '', ...props }) => {
  return (
    <th
      scope="col"
      className={`px-6 py-3 font-medium tracking-wider ${className}`}
      {...props}>

      {children}
    </th>);

};
export const TableCell: React.FC<
  React.TdHTMLAttributes<HTMLTableCellElement>> =
({ children, className = '', ...props }) => {
  return (
    <td className={`px-6 py-4 whitespace-nowrap ${className}`} {...props}>
      {children}
    </td>);

};