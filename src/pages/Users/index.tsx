import { PlusOutlined, ExportOutlined } from '@ant-design/icons';
import { Button, Tooltip, Popconfirm, Tag, message } from 'antd';
import React, { useCallback, useRef, useState } from 'react';
import { useIntl, FormattedMessage, Link } from 'umi';
import { PageContainer } from '@ant-design/pro-layout';
import type { ProColumns, ActionType } from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import { format } from 'date-fns';
import { users, deleteUser } from '@/services/escola-lms/user';
import { usersCsvExport } from '@/services/escola-lms/csv';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { DATETIME_FORMAT } from '@/consts/dates';
import SecureUpload from '@/components/SecureUpload';
import UserRoleSelect from '../../components/UserRoleSelect';
import TypeButtonDrawer from '../../components/TypeButtonDrawer';
import './index.css';

const handleRemove = async (id: number) => {
  await deleteUser(id);
  return true;
};

export const TableColumns: ProColumns<API.UserListItem>[] = [
  {
    title: <FormattedMessage id="ID" defaultMessage="ID" />,
    dataIndex: 'id',
    hideInSearch: true,
  },
  {
    title: <FormattedMessage id="created_at" defaultMessage="created_at" />,
    dataIndex: 'created_at',
    hideInSearch: true,
    render: (_, record) =>
      record.created_at && format(new Date(record.created_at), DATETIME_FORMAT),
  },
  {
    title: <FormattedMessage id="first_name" defaultMessage="first_name" />,
    dataIndex: 'first_name',
    hideInSearch: true,
  },
  {
    title: <FormattedMessage id="last_name" defaultMessage="last_name" />,
    dataIndex: 'last_name',
    hideInSearch: true,
  },
  {
    title: <FormattedMessage id="email" defaultMessage="email" />,
    dataIndex: 'email',
    hideInSearch: true,
  },
  {
    title: <FormattedMessage id="search" defaultMessage="search" />,
    dataIndex: 'search',
    hideInSearch: false,
    hideInTable: true,
    hideInDescriptions: true,
    tooltip: <FormattedMessage id="search_tooltip_1" />,
  },

  {
    title: <FormattedMessage id="is_active" />,
    dataIndex: 'is_active',
    hideInSearch: true,
    render: (_, record) => [
      <Tag color={record.is_active ? 'green' : 'red'}>
        {record.is_active ? <FormattedMessage id="Active" /> : <FormattedMessage id="Inactive" />}
      </Tag>,
    ],
  },

  {
    title: <FormattedMessage id="email_verified" defaultMessage="email_verified" />,
    dataIndex: 'email_verified',
    hideInSearch: true,
    render: (_, record) => [
      <Tag color={record.email_verified ? 'green' : 'red'}>
        {record.email_verified ? (
          <FormattedMessage id="verified" />
        ) : (
          <FormattedMessage id="unverified" />
        )}
      </Tag>,
    ],
  },

  {
    title: <FormattedMessage id="roles" defaultMessage="roles" />,
    dataIndex: 'roles',
    hideInSearch: true,
    render: (_, record) => record.roles.map((role) => <Tag key={role}>{role}</Tag>),
  },
  {
    hideInSearch: false,
    title: <FormattedMessage id="roles" defaultMessage="roles" />,
    dataIndex: 'role',
    renderFormItem: (item, { type, defaultRender, ...rest }) => {
      return <UserRoleSelect {...rest} />;
    },
    render: (_, record) => {
      if (record.parent_id) {
        return (
          <TypeButtonDrawer
            type={'EscolaLms\\Auth\\Models\\UserGroup'}
            type_id={record.parent_id}
          />
        );
      }
      return (
        <React.Fragment>
          <FormattedMessage id="none" />
        </React.Fragment>
      );
    },
  },
];

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const intl = useIntl();
  const [params, setParams] = useState({});
  const [loadingExport, setLoadingExport] = useState(false);

  const handleDownload = useCallback(async () => {
    setLoadingExport(true);
    try {
      const request = await usersCsvExport(params);

      if (request) {
        const uri = 'data:text/csv;charset=utf-8,' + request;
        const downloadLink = document.createElement('a');
        downloadLink.href = uri;
        downloadLink.download = 'users.csv';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingExport(false);
    }
  }, [params]);

  return (
    <PageContainer>
      <ProTable<API.UserListItem, API.PageParams & { search: string; role: string }>
        headerTitle={intl.formatMessage({
          id: 'users',
          defaultMessage: 'users',
        })}
        actionRef={actionRef}
        rowKey="key"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <SecureUpload
            title={intl.formatMessage({
              id: 'import_users',
            })}
            url="/api/admin/csv/users"
            name="file"
            accept=".csv"
            data={{
              return_url: `${window.location.origin}/#/user/reset-password`,
            }}
            onChange={(info) => {
              if (info.file.status === 'done') {
                if (info.file.response.success) {
                  message.success(info.file.response.message);
                }
              }
              if (info.file.status === 'error') {
                message.error(info.file.response.message);
                console.error(info.file.response);
              }
            }}
          />,
          <Button
            loading={loadingExport}
            type="primary"
            key="primary"
            onClick={() => handleDownload()}
          >
            <ExportOutlined /> <FormattedMessage id="export" defaultMessage="export" />
          </Button>,

          <Link to="/users/new">
            <Button type="primary" key="primary">
              <PlusOutlined /> <FormattedMessage id="new" defaultMessage="new" />
            </Button>
          </Link>,
        ]}
        request={({ pageSize, current, search, role }) => {
          setParams({ pageSize, current, search, role });
          const requestRole = role && role.toString() === 'all' ? undefined : role;

          return users({ pageSize, current, search, role: requestRole }).then((response) => {
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
        columns={[
          ...TableColumns,
          {
            hideInSearch: true,
            title: <FormattedMessage id="pages.searchTable.titleOption" />,
            dataIndex: 'option',
            valueType: 'option',
            render: (_, record) => [
              <Link to={`/users/${record.id}/user_info`} key="edit">
                <Tooltip title={<FormattedMessage id="edit" defaultMessage="edit" />}>
                  <Button type="primary" icon={<EditOutlined />}></Button>
                </Tooltip>
              </Link>,
              <Popconfirm
                key="delete"
                title={
                  <FormattedMessage
                    id="deleteQuestion"
                    defaultMessage="Are you sure to delete this record?"
                  />
                }
                onConfirm={async () => {
                  const success = await handleRemove(record.id);
                  if (success) {
                    if (actionRef.current) {
                      actionRef.current.reload();
                    }
                  }
                }}
                okText={<FormattedMessage id="yes" />}
                cancelText={<FormattedMessage id="no" />}
              >
                <Tooltip title={<FormattedMessage id="delete" defaultMessage="delete" />}>
                  <Button type="primary" icon={<DeleteOutlined />} danger></Button>
                </Tooltip>
              </Popconfirm>,
            ],
          },
        ]}
      />
    </PageContainer>
  );
};

export default TableList;
