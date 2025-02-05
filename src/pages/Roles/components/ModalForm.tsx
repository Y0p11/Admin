import React from 'react';
import { Form } from 'antd';
import ProForm, { ProFormText, ModalForm } from '@ant-design/pro-form';

import { useIntl, FormattedMessage } from 'umi';

export const RolesModalForm: React.FC<{
  id?: number | false;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onFinish: (formData: API.Setting) => Promise<boolean | void>;
}> = (props) => {
  const intl = useIntl();

  const { visible, onVisibleChange, onFinish, id } = props;

  const [form] = Form.useForm();

  return (
    <ModalForm
      form={form}
      title={intl.formatMessage({
        id: id ? 'editSetting' : 'newSetting',
        defaultMessage: id ? 'editSetting' : 'newSetting',
      })}
      width="30vw"
      visible={visible}
      onVisibleChange={onVisibleChange}
      onFinish={onFinish}
    >
      <ProForm.Group>
        <ProFormText
          label={<FormattedMessage id="name" defaultMessage="name" />}
          rules={[
            {
              required: true,
            },
          ]}
          width="md"
          name="name"
        />{' '}
      </ProForm.Group>
    </ModalForm>
  );
};

export default RolesModalForm;
