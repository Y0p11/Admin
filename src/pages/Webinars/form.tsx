import { useMemo, useState, useEffect } from 'react';
import { message, Spin, Row, Col, Alert, Button } from 'antd';
import ProForm, {
  ProFormText,
  ProFormSelect,
  ProFormTextArea,
  ProFormDateTimePicker,
} from '@ant-design/pro-form';
import ProCard from '@ant-design/pro-card';
import WysiwygMarkdown from '@/components/WysiwygMarkdown';
import { PageContainer } from '@ant-design/pro-layout';
import { useParams, history, useIntl, FormattedMessage } from 'umi';
import { useCallback } from 'react';
import { createWebinar, getWebinar, updateWebinar } from '@/services/escola-lms/webinars';
import UserSelect from '@/components/UserSelect';
import ProFormImageUpload from '@/components/ProFormImageUpload';
import { splitImagePath } from '@/utils/utils';
import TagsInput from '@/components/TagsInput';
import UnsavedPrompt from '@/components/UnsavedPrompt';
import useValidateFormEdit from '@/hooks/useValidateFormEdit';
import EditValidateModal from '@/components/EditValidateModal';
import ProductWidget from '@/components/ProductWidget';
import UserSubmissions from '@/components/UsersSubmissions';

const WebinarForm = () => {
  const intl = useIntl();
  const params = useParams<{ webinar?: string; tab?: string }>();
  const { webinar, tab = 'attributes' } = params;
  const isNew = webinar === 'new';
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [data, setData] = useState<Partial<API.Webinar>>();
  const { manageCourseEdit, setManageCourseEdit, validateCourseEdit } = useValidateFormEdit();

  const [form] = ProForm.useForm();

  const fetchData = useCallback(async () => {
    const response = await getWebinar(Number(webinar));
    if (response.success) {
      if (tab === 'attributes') {
        validateCourseEdit(response.data);
      }

      setData({
        ...response.data,
      });
    }
  }, [webinar]);

  useEffect(() => {
    if (isNew) {
      setData({
        name: 'new',
      });
      return;
    }

    fetchData();
  }, [webinar]);

  const formProps = useMemo(
    () => ({
      onFinish: async (values: Partial<API.Webinar>) => {
        if (manageCourseEdit.disableEdit) {
          setManageCourseEdit({
            showModal: true,
            disableEdit: true,
            clicked: false,
          });
          return;
        }

        const postData = {
          ...values,
          ...(tab === 'attributes' && { active_from: new Date(String(values.active_from)) }),
          ...(tab === 'attributes' && { active_to: new Date(String(values.active_to)) }),
          ...(tab === 'media' && { image_url: data && data.image_url }),
          ...(tab === 'media' && {
            image_path: data && data.image_url && splitImagePath(data.image_url),
          }),
          ...(tab === 'branding' && { logotype_url: data && data.logotype_url }),
          ...(tab === 'branding' && {
            logotype_path: data && data.logotype_path && splitImagePath(data.logotype_path),
          }),
          trainers:
            values.trainers &&
            values.trainers.map((author) => (typeof author === 'object' ? author.id : author)),
        };

        let response: API.DefaultResponse<API.Webinar>;
        if (isNew) {
          response = await createWebinar(postData);
          if (response.success) {
            setUnsavedChanges(false);
            history.push(`/courses/webinars/${response.data.id}`);
          }
        } else {
          response = await updateWebinar(Number(webinar), postData);
          if (response.success) {
            setUnsavedChanges(false);
            validateCourseEdit(response.data);
            history.push(`/courses/webinars/${response.data.id}/${tab}`);
          }
        }
        message.success(response.message);
      },
      initialValues: data,
    }),
    [data, webinar, tab, manageCourseEdit],
  );

  if (!data) {
    return <Spin />;
  }

  return (
    <PageContainer
      title={
        isNew ? <FormattedMessage id="menu.Webinars" /> : <FormattedMessage id="webinar.edit" />
      }
      header={{
        breadcrumb: {
          routes: [
            {
              path: 'webinars',
              breadcrumbName: intl.formatMessage({
                id: 'menu.Webinars',
              }),
            },
            {
              path: String(webinar),
              breadcrumbName: intl.formatMessage({
                id: 'form',
              }),
            },
            {
              path: '/',
              breadcrumbName: intl.formatMessage({
                id: String(data.name),
              }),
            },
            {
              path: String(tab),
              breadcrumbName: intl.formatMessage({
                id: String(tab),
              }),
            },
          ],
        },
      }}
    >
      <ProCard
        tabs={{
          type: 'card',
          activeKey: tab,
          onChange: (key) => history.push(`/courses/webinars/${webinar}/${key}`),
        }}
      >
        <ProCard.TabPane key="attributes" tab={<FormattedMessage id="attributes" />}>
          {manageCourseEdit.disableEdit && (
            <Alert
              closable
              style={{ marginBottom: '20px' }}
              type="warning"
              message={
                <FormattedMessage
                  id="course_edit_warning_message"
                  defaultMessage="course_edit_warning_message"
                />
              }
              action={
                <Button
                  onClick={() =>
                    setManageCourseEdit({
                      showModal: true,
                      disableEdit: true,
                      clicked: true,
                    })
                  }
                  type="primary"
                >
                  <FormattedMessage
                    id="questionnaire.submit"
                    defaultMessage="questionnaire.submit"
                  />
                </Button>
              }
            />
          )}
          <UnsavedPrompt show={unsavedChanges} />
          <EditValidateModal visible={manageCourseEdit.showModal} setManage={setManageCourseEdit} />
          <ProForm
            {...formProps}
            form={form}
            onValuesChange={() => {
              setUnsavedChanges(true);
            }}
          >
            <ProForm.Group>
              <ProFormText
                width="md"
                name="name"
                label={<FormattedMessage id="name" />}
                tooltip={<FormattedMessage id="name" />}
                placeholder={intl.formatMessage({
                  id: 'name',
                  defaultMessage: 'name',
                })}
                required
                disabled={manageCourseEdit.disableEdit}
              />

              <ProFormText
                width="sm"
                name="duration"
                label={<FormattedMessage id="duration" />}
                tooltip={<FormattedMessage id="duration" />}
                placeholder={intl.formatMessage({
                  id: 'duration',
                  defaultMessage: 'duration',
                })}
                disabled={manageCourseEdit.disableEdit}
              />
              <ProFormSelect
                name="status"
                width="xs"
                label={<FormattedMessage id="status" />}
                valueEnum={{
                  draft: intl.formatMessage({
                    id: 'draft',
                    defaultMessage: 'draft',
                  }),
                  published: intl.formatMessage({
                    id: 'published',
                    defaultMessage: 'published',
                  }),
                  archived: intl.formatMessage({
                    id: 'archived',
                    defaultMessage: 'archived',
                  }),
                }}
                initialValue={{
                  draft: intl.formatMessage({
                    id: 'draft',
                    defaultMessage: 'draft',
                  }),
                }}
                placeholder={intl.formatMessage({
                  id: 'status',
                })}
                rules={[{ required: true, message: <FormattedMessage id="select" /> }]}
                disabled={manageCourseEdit.disableEdit}
              />
            </ProForm.Group>
            <ProForm.Group>
              <ProFormDateTimePicker
                width="sm"
                name="active_from"
                label={<FormattedMessage id="active_from" />}
                tooltip={<FormattedMessage id="active_from" />}
                placeholder={intl.formatMessage({
                  id: 'active_from',
                  defaultMessage: 'active_from',
                })}
                disabled={manageCourseEdit.disableEdit}
              />
              <ProFormDateTimePicker
                width="sm"
                name="active_to"
                label={<FormattedMessage id="active_to" />}
                tooltip={<FormattedMessage id="active_to" />}
                placeholder={intl.formatMessage({
                  id: 'active_to',
                  defaultMessage: 'active_to',
                })}
                disabled={manageCourseEdit.disableEdit}
              />
              <ProForm.Item
                name="trainers"
                label={<FormattedMessage id="tutor" />}
                valuePropName="value"
              >
                <UserSelect multiple />
              </ProForm.Item>
            </ProForm.Group>
            <ProForm.Group>
              <ProFormTextArea
                width="lg"
                name="short_desc"
                label={<FormattedMessage id="short_description" />}
                tooltip={<FormattedMessage id="short_description" />}
              />
            </ProForm.Group>
            <ProForm.Group>
              <ProForm.Item
                name="agenda"
                label={<FormattedMessage id="program" />}
                tooltip={<FormattedMessage id="program" />}
                valuePropName="value"
              >
                <WysiwygMarkdown directory={`webinars/${webinar}/wysiwyg`} />
              </ProForm.Item>
            </ProForm.Group>
            <ProForm.Group>
              <ProForm.Item
                name="description"
                label={<FormattedMessage id="description" />}
                tooltip={<FormattedMessage id="description_tooltip" />}
                valuePropName="value"
              >
                <WysiwygMarkdown directory={`webinars/${webinar}/wysiwyg`} />
              </ProForm.Item>
            </ProForm.Group>
          </ProForm>
        </ProCard.TabPane>{' '}
        {!isNew && (
          <ProCard.TabPane
            key="product"
            tab={<FormattedMessage id="product" />}
            disabled={manageCourseEdit.disableEdit}
          >
            {webinar && (
              <ProductWidget
                productable={{
                  class_type: 'App\\Models\\Webinar',
                  class_id: webinar,
                  name: String(data.name),
                  quantity: 1,
                }}
              />
            )}
          </ProCard.TabPane>
        )}
        {!isNew && (
          <ProCard.TabPane
            key="media"
            tab={<FormattedMessage id="media" />}
            disabled={manageCourseEdit.disableEdit}
          >
            <ProForm {...formProps}>
              <ProFormImageUpload
                folder={`webinar/${webinar}`}
                title="image"
                action={`/api/admin/webinars/${webinar}`}
                src_name="image_url"
                form_name="image"
                getUploadedSrcField={(info) => info.file.response.data.image_url}
                setPath={(removedPath) =>
                  setData((prevState) => ({
                    ...prevState,
                    ...removedPath,
                  }))
                }
              />
            </ProForm>
          </ProCard.TabPane>
        )}
        {!isNew && (
          <ProCard.TabPane
            key="tags"
            tab={<FormattedMessage id="tags" />}
            disabled={manageCourseEdit.disableEdit}
          >
            <Row>
              <Col span={12}>
                <ProForm {...formProps}>
                  <ProForm.Item
                    label={<FormattedMessage id="tags" />}
                    name="tags"
                    valuePropName="value"
                  >
                    <TagsInput />
                  </ProForm.Item>
                </ProForm>
              </Col>
            </Row>
          </ProCard.TabPane>
        )}{' '}
        {!isNew && (
          <ProCard.TabPane
            key="branding"
            tab={<FormattedMessage id="branding" />}
            disabled={manageCourseEdit.disableEdit}
          >
            <ProForm {...formProps}>
              <ProFormImageUpload
                folder={`webinar/${webinar}`}
                title="logotype"
                action={`/api/admin/webinars/${webinar}`}
                src_name="logotype_url"
                form_name="logotype"
                getUploadedSrcField={(info) => info.file.response.data.logotype_url}
                setPath={(removedPath) =>
                  setData((prevState) => ({
                    ...prevState,
                    ...removedPath,
                  }))
                }
              />
            </ProForm>
          </ProCard.TabPane>
        )}{' '}
        {!isNew && (
          <ProCard.TabPane
            key="user_submission"
            tab={<FormattedMessage id="user_submission" />}
            disabled={manageCourseEdit.disableEdit}
          >
            <Row>
              <Col span={12}>
                {webinar && <UserSubmissions id={Number(webinar)} type="App\Models\Webinar" />}
              </Col>
            </Row>
          </ProCard.TabPane>
        )}
      </ProCard>
    </PageContainer>
  );
};

export default WebinarForm;
