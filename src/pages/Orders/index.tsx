import React, { useRef } from 'react';
import { useIntl, FormattedMessage } from 'umi';
import { PageContainer } from '@ant-design/pro-layout';
import type { ProColumns, ActionType } from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';

import { orders } from '@/services/escola-lms/orders';
import UserSelect from '@/components/UserSelect';
import { format } from 'date-fns';

import TypeButtonDrawer from '@/components/TypeButtonDrawer';
import { Space } from 'antd';
import { DATETIME_FORMAT } from '@/consts/dates';
import ProductsSelect from '@/components/ProductsSelect';

const OrderItems: React.FC<{ items: API.OrderItem[] }> = ({ items }) => {
  return (
    <Space key={'space'}>
      {items.map((item) => (
        <TypeButtonDrawer key={item.product_id} type={'Product'} type_id={item.product_id} />
      ))}
    </Space>
  );
};

export const TableColumns: ProColumns<API.OrderListItem>[] = [
  {
    title: <FormattedMessage id="ID" defaultMessage="ID" />,
    dataIndex: 'id',
    hideInSearch: true,
  },
  {
    title: <FormattedMessage id="dateRange" defaultMessage="Date Range" />,
    dataIndex: 'dateRange',
    hideInSearch: false,
    hideInForm: true,
    hideInTable: true,
    valueType: 'dateRange',
    fieldProps: {
      allowEmpty: [true, true],
    },
  },
  {
    title: <FormattedMessage id="created_at" defaultMessage="Created at" />,
    dataIndex: 'created_at',
    hideInSearch: true,
    sorter: true,
    render: (_, record) =>
      record.created_at && format(new Date(record.created_at), DATETIME_FORMAT),
  },
  {
    title: <FormattedMessage id="subtotal" defaultMessage="SubTotal" />,
    dataIndex: 'subtotal',
    hideInSearch: true,
    render: (_, record) => Number(record.subtotal) / 100,
  },
  {
    title: <FormattedMessage id="tax" defaultMessage="Tax" />,
    dataIndex: 'tax',
    hideInSearch: true,
    render: (_, record) => Number(record.tax) / 100,
  },
  {
    title: <FormattedMessage id="total" defaultMessage="total" />,
    dataIndex: 'total',
    hideInSearch: true,
    render: (_, record) => Number(record.total) / 100,
  },
  {
    title: <FormattedMessage id="items" defaultMessage="items" />,
    dataIndex: 'items',
    hideInSearch: true,
    render: (_, record) => record.items && <OrderItems items={record.items as API.OrderItem[]} />,
  },
  {
    title: <FormattedMessage id="user" defaultMessage="user" />,
    dataIndex: 'user_id',
    key: 'user_id',
    hideInSearch: false,
    sorter: true,
    renderFormItem: (item, { type, defaultRender, ...rest }, form) => {
      if (type === 'form') {
        return null;
      }
      const stateType = form.getFieldValue('state');
      return (
        <UserSelect
          {...rest}
          state={{
            type: stateType,
          }}
        />
      );
    },
    render: (_, record) =>
      record.user_id && <TypeButtonDrawer type={'App\\Models\\User'} type_id={record.user_id} />,
  },

  {
    title: <FormattedMessage id="product" defaultMessage="product" />,
    dataIndex: 'product_id',
    key: 'product_id',
    hideInSearch: false,
    hideInTable: true,
    hideInDescriptions: true,

    renderFormItem: (item, { type, defaultRender, ...rest }, form) => {
      if (type === 'form') {
        return null;
      }
      const stateType = form.getFieldValue('state');
      return (
        <ProductsSelect
          multiple={false}
          {...rest}
          state={{
            type: stateType,
          }}
        />
      );
    },
  },

  {
    title: <FormattedMessage id="status" defaultMessage="status" />,
    dataIndex: 'status',
    hideInSearch: true,
  },
];

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const intl = useIntl();

  return (
    <PageContainer>
      <ProTable<
        API.OrderListItem,
        API.PageParams &
          EscolaLms.Cart.Http.Requests.Admin.OrderSearchRequest & {
            dateRange: [string, string];
          }
      >
        headerTitle={intl.formatMessage({
          id: 'orders',
          defaultMessage: 'orders',
        })}
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        request={({ pageSize, current, user_id, dateRange, product_id }, sort) => {
          const sortArr = sort && Object.entries(sort)[0];
          const date_from =
            dateRange && dateRange[0] ? format(new Date(dateRange[0]), DATETIME_FORMAT) : undefined;
          const date_to =
            dateRange && dateRange[1] ? format(new Date(dateRange[1]), DATETIME_FORMAT) : undefined;
          return orders({
            pageSize,
            current,
            user_id,
            date_from,
            date_to,
            product_id,
            order_by: sortArr && sortArr[0], // i like nested ternary
            /* eslint-disable */ order: sortArr
              ? sortArr[1] === 'ascend'
                ? 'ASC'
                : 'DESC'
              : undefined,
          }).then((response) => {
            if (response.success) {
              return {
                data: response.data,
                total: response.meta.total,
                success: true,
              };
            }
            return [];
          });
        }}
        columns={TableColumns}
      />
    </PageContainer>
  );
};

export default TableList;
