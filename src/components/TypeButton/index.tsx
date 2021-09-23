import React from 'react';
import UserRow from '@/components/UserRow';
import OrderRow from '@/components/OrderRow';
import CourseRow from '@/components/CourseRow';

type PossibleType =
  | 'App\\Models\\User'
  | 'EscolaLms\\Core\\Models\\User'
  | 'EscolaLms\\Cart\\Models\\Order'
  | 'EscolaLms\\Cart\\Models\\Course';
type DataProps = API.LinkedType;

export const TypeButton: React.FC<{
  type: PossibleType;
  type_id: number;
  onData: (data: DataProps) => void;
}> = ({ type, type_id, onData }) => {
  switch (type) {
    case 'App\\Models\\User':
    case 'EscolaLms\\Core\\Models\\User':
      return <UserRow id={type_id} onLoaded={(user) => onData({ type, value: user })} />;
    case 'EscolaLms\\Cart\\Models\\Order':
      return <OrderRow id={type_id} onLoaded={(order) => onData({ type, value: order })} />;
    case 'EscolaLms\\Cart\\Models\\Course':
      return <CourseRow id={type_id} onLoaded={(order) => onData({ type, value: order })} />;
    default:
      return type && type_id ? (
        <pre>
          {type} id: {type_id}
        </pre>
      ) : (
        <React.Fragment />
      );
  }
};

export default TypeButton;