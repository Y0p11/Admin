import { useCallback, useEffect, useState } from 'react';
import { useModel } from 'umi';
import { getNotifications, readNotification } from '@/services/escola-lms/notifications';

import NoticeIcon from './NoticeIcon';
import styles from './index.less';

export type GlobalHeaderRightProps = {
  fetchingNotices?: boolean;
  onNoticeVisibleChange?: (visible: boolean) => void;
  onNoticeClear?: (tabName?: string) => void;
};

const getNoticeData = (notices: API.Notification[]): Record<string, API.Notification[]> => {
  if (!notices || notices.length === 0 || !Array.isArray(notices)) {
    return {};
  }

  return {
    notifyList: notices,
  };
};

const getUnreadData = (noticeData: Record<string, API.Notification[]>) => {
  const unreadMsg: Record<string, number> = {};
  Object.keys(noticeData).forEach((key) => {
    const value = noticeData[key];

    if (!unreadMsg[key]) {
      unreadMsg[key] = 0;
    }

    if (Array.isArray(value)) {
      unreadMsg[key] = value.filter((item) => !item.read_at).length;
    }
  });
  return unreadMsg;
};

const NoticeIconView = () => {
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState || {};

  const [notices, setNotices] = useState<API.Notification[]>([]);

  const fetchNotifications = useCallback(async () => {
    const request = await getNotifications({}, currentUser?.data.id);
    const response = await request;

    if (response.success) {
      setNotices(response.data);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const noticeData = getNoticeData(notices);
  const unreadMsg = getUnreadData(noticeData || {});

  const changeReadState = (id: string) => {
    readNotification(id);
    setNotices(
      notices.map((item) => {
        const notice = { ...item };
        if (notice.id === id) {
          notice.read_at = new Date();
        }
        return notice;
      }),
    );
  };

  return (
    <NoticeIcon
      className={styles.action}
      count={unreadMsg.notifyList}
      onItemClick={(item) => {
        changeReadState(item.id!);
      }}
      // clearText="Clear all"
      // onClear={() => clearAll()}
      loading={false}
    >
      <NoticeIcon.Tab
        tabKey="notification"
        list={noticeData.notifyList}
        title={'notifications.list'}
        emptyText="No notices"
        showViewMore
      />
      {/* TODO:uncoment this if you need mor tabs in notifylist */}
      {/* <NoticeIcon.Tab
        tabKey="message"
        count={unreadMsg.message}
        list={noticeData.message}
        title="Readed"
        emptyText="empty"
        showViewMore
      /> */}
    </NoticeIcon>
  );
};

export default NoticeIconView;