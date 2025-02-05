import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Select, Spin } from 'antd';

import { course as getCourses, getCourse } from '@/services/escola-lms/course';
import { webinars as getWebinars, getWebinar } from '@/services/escola-lms/webinars';
import {
  consultations as getConsultations,
  getConsultation,
} from '@/services/escola-lms/consultations';
import { FormattedMessage } from 'umi';
import type { DefaultOptionType } from 'antd/lib/select';

type CollectionModelItem = {
  id: number;
  name: string;
};

// this creates a simple state object with typegurad
const prepareObj = (arr: (API.Course | API.Webinar | API.Consultation)[]) =>
  arr.map((item: API.Course | API.Webinar | API.Consultation) => {
    if ('name' in item) {
      return {
        id: Number(item.id),
        name: item.name,
      };
    }

    return {
      id: Number(item.id),
      name: item.title ? item.title : '',
    };
  });

export const CourseSelect: React.FC<{
  state?: {
    type: number;
  };
  multiple?: boolean;
  value?: string;
  onChange?: (
    value: string | string[] | number | number[],
    option: DefaultOptionType | DefaultOptionType[],
  ) => void;
  defaultValue?: string | string[] | number | number[];
  modelType?: string;
}> = ({ value, onChange, multiple = false, defaultValue, modelType = 'COURSE' }) => {
  const [modelCollection, setModelCollection] = useState<CollectionModelItem[]>([]);
  const [fetching, setFetching] = useState(false);

  const abortController = useRef<AbortController>();

  const modelCollectionMethod = useCallback(
    (search: string) => {
      switch (modelType) {
        case 'COURSE':
          return getCourses({ title: search }, { signal: abortController?.current?.signal });
        case 'WEBINAR':
          return getWebinars();
        case 'CONSULTATIONS':
          return getConsultations();
        default:
          return getCourses({ title: search }, { signal: abortController?.current?.signal });
      }
    },
    [modelType, abortController],
  );
  const modelSingleMethod = useCallback(
    (id: string | number) => {
      switch (modelType) {
        case 'COURSE':
          return getCourse(Number(id), { signal: abortController.current?.signal });
        case 'WEBINAR':
          return getWebinar(Number(id), { signal: abortController.current?.signal });
        case 'CONSULTATIONS':
          return getConsultation(Number(id), { signal: abortController.current?.signal });
        default:
          return getCourse(Number(id), { signal: abortController.current?.signal });
      }
    },
    [modelType, abortController],
  );

  const fetch = useCallback(
    (search?: string) => {
      setFetching(true);
      if (abortController.current) {
        abortController.current.abort();
      }

      abortController.current = new AbortController();

      modelCollectionMethod(search || '')
        .then((response) => {
          if (response.success) {
            setModelCollection(prepareObj(response.data));
          }
          setFetching(false);
        })
        .catch(() => setFetching(false));
    },
    [modelType],
  );

  const onSearch = useCallback(
    (search: string) => {
      fetch(search);
    },
    [fetch],
  );

  useEffect(() => {
    abortController.current = new AbortController();

    if (value) {
      modelSingleMethod(Number(value)).then((response) => {
        if (response) {
          if (response.success) {
            setModelCollection((prevCourses) => [...prevCourses, ...prepareObj([response.data])]);
          }
        }
      });
    }
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [value, modelType]);

  return (
    <Select<string | string[] | number | number[]>
      defaultValue={defaultValue}
      onFocus={() => fetch()}
      allowClear
      style={{ width: '100%' }}
      value={value}
      onChange={onChange}
      mode={multiple ? 'multiple' : undefined}
      showSearch
      onSearch={onSearch}
      placeholder={<FormattedMessage id="select_content" defaultMessage="select_content" />}
      optionFilterProp="children"
      filterOption={(input, option) => {
        if (option && option.children) {
          return option?.children?.toString().toLowerCase().indexOf(input.toLowerCase()) >= 0;
        }
        return true;
      }}
      notFoundContent={fetching ? <Spin size="small" /> : null}
    >
      {modelCollection.map((modelItem: CollectionModelItem) => (
        <Select.Option key={modelItem.id} value={modelItem.id}>
          {modelItem.name}
        </Select.Option>
      ))}
    </Select>
  );
};

export default CourseSelect;
