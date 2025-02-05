import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { message } from 'antd';
import { useLocation } from 'umi';
import { history } from 'umi';
import type { Location } from 'history';

import {
  program,
  createLesson as apiCreateLesson,
  updateLesson as apiUpdateLesson,
  createTopic as apiCreateTopic,
  updateTopic as apiUpdateTopic,
  removeLesson as apiRemoveLesson,
  removeTopic as apiRemoveTopic,
  sort,
  cloneLesson as apiCloneLesson,
  cloneTopic as apiCloneTopic,
} from '@/services/escola-lms/course';

import type { UploadChangeParam } from 'antd/lib/upload';
import { TopicType } from '@/services/escola-lms/enums';

type CurrentEditMode =
  | { mode: 'lesson'; id: number; value?: API.Lesson | null }
  | { mode: 'topic'; id: number; value?: API.Topic | null }
  | { mode: 'init' };

type ProgramContext = {
  currentEditMode?: CurrentEditMode;
  state?: API.CourseProgram;
  h5ps?: any[];
  // token: credentials.token,
  id?: number;
  addNewLesson?: (parentId?: number) => API.Lesson;
  updateLesson?: (lesson_id: number, data: FormData) => Promise<void | boolean>;
  updateTopic?: (topic_id: number, data: FormData) => Promise<void>;
  // addResource,
  // removeResource,
  deleteLesson?: (lesson_id: number) => void;
  // updateH5P,
  sortLesson?: (lesson_id: number, upDirection?: boolean) => void;
  addNewTopic?: (lesson_id: number, type: API.TopicType) => API.Topic;
  deleteTopic?: (topic_id: number) => void;
  sortTopic?: (lesson_id: number, topic_id: number, upDirection?: boolean) => void;
  sortTopics?: (lesson_id: number, new_order: API.Lesson[]) => void;
  updateTopicsOrder?: (lesson_id: number) => void;
  onTopicUploaded?: (prevTopicId: number, info: UploadChangeParam) => void;
  cloneTopic?: (topic_id: number) => void;
  cloneLesson?: (lesson_id: number) => void;
  getLessons?: () => void;
};

export const Context = React.createContext<ProgramContext>({});

const getRandomId = () => Math.round(Math.random() * 99999);

const getFlatLessons = (lessons: API.Lesson[]): API.Lesson[] => {
  return lessons.reduce((acc, curr) => {
    return [...acc, ...(curr.lessons ? getFlatLessons(curr.lessons) : []), curr];
  }, [] as API.Lesson[]) as API.Lesson[];
};

export const getFlatTopics = (lessons: API.Lesson[]): API.Topic[] => {
  return lessons.reduce((acc, curr) => {
    return [...acc, ...(curr.lessons ? getFlatTopics(curr.lessons) : []), ...(curr.topics ?? [])];
  }, [] as API.Topic[]) as API.Topic[];
};

const recursiveAddTopicToLessons = (
  lessons: API.Lesson[],
  lessonId: number,
  topic: API.Topic,
): API.Lesson[] => {
  return lessons.map((lesson) => ({
    ...lesson,
    lessons: lesson.lessons ? recursiveAddTopicToLessons(lesson.lessons, lessonId, topic) : [],
    topics: lesson.id === lessonId ? [...(lesson.topics ?? []), topic] : lesson.topics ?? [],
  }));
};

/*
const recursiveEditTopic = (
  lessons: API.Lesson[],
  topicId: number,
  updatedTopic: API.Topic,
): API.Lesson[] => {
  return lessons.map((lesson) => ({
    ...lesson,
    lessons: lesson.lessons ? recursiveEditTopic(lesson.lessons, topicId, updatedTopic) : [],
    topics: lesson.topics
      ? lesson.topics.map((topic) => (topic.id === topicId ? updatedTopic : topic))
      : [],
  }));
};
*/

const recursiveAddLessonToLessons = (
  lessons: API.Lesson[],
  newLesson: API.Lesson,
  lessonId?: number | null,
): API.Lesson[] => {
  if (!lessonId) {
    return [...lessons, newLesson];
  }
  return lessons.map((lesson) => ({
    ...lesson,
    lessons: [
      ...(lesson.lessons ? recursiveAddLessonToLessons(lesson.lessons, newLesson, lessonId) : []),
      ...(lesson.id === lessonId ? [newLesson] : []),
    ],
  }));
};

const recursiveEditLesson = (
  lessons: API.Lesson[],
  lessonId: number,
  updatedLesson: API.Lesson,
): API.Lesson[] => {
  return lessons.map((lesson) => ({
    ...(lesson.id === lessonId ? updatedLesson : lesson),
    lessons: lesson.lessons ? recursiveEditLesson(lesson.lessons, lessonId, updatedLesson) : [],
  }));
};

const appendParentIdToLessons = (lessons: API.Lesson[], lessonParentId?: number): API.Lesson[] => {
  return lessons.map((lesson) => ({
    ...lesson,
    parent_id: lessonParentId,
    lessons: lesson.lessons ? appendParentIdToLessons(lesson.lessons, lesson.id) : [],
  }));
};

const recursiveDeleteLesson = (lessons: API.Lesson[], lessonId: number): API.Lesson[] => {
  return lessons
    .filter((lesson) => lesson.id !== lessonId)
    .map((lesson) => ({
      ...lesson,
      lessons: lesson.lessons ? recursiveDeleteLesson(lesson.lessons, lessonId) : [],
    }));
};

const recursiveDeleteTopic = (lessons: API.Lesson[], topicId: number): API.Lesson[] => {
  return lessons.map((lesson) => ({
    ...lesson,
    lessons: lesson.lessons ? recursiveDeleteTopic(lesson.lessons, topicId) : [],
    topics: lesson.topics ? lesson.topics.filter((topic) => topic.id !== topicId) : [],
  }));
};

export const AppContext: React.FC<{ children: React.ReactNode; id: number }> = ({
  children,
  id,
}) => {
  const [state, setState] = useState<API.CourseProgram>();

  const flatTopics: API.Topic[] = useMemo(() => {
    return state && state.lessons ? getFlatTopics(state.lessons) : [];
  }, [state]);

  const flatLessons: API.Lesson[] = useMemo(() => {
    return state && state.lessons ? getFlatLessons(state.lessons) : [];
  }, [state]);

  const [h5ps, setH5ps] = useState([]);

  const l = useLocation() as Location & { query: { lesson?: string; topic?: string } };

  useEffect(() => {
    setH5ps([]);
  }, []);

  /*
  useEffect(() => {
    API(`h5p`, token)
      .then((response) => response.json())
      .then((data) => {
        setH5ps(data);
      });
    //.then(() => addNewLesson());
  }, []);
  */

  const getLessons = useCallback(() => {
    program(id).then((data) => {
      return (
        data.success &&
        setState({
          ...data.data,
          lessons: appendParentIdToLessons(data.data.lessons),
        })
      );
    });
  }, [id]);

  useEffect(() => {
    getLessons();
  }, [getLessons]);

  const getLessonIdByTopicId = useCallback(
    (topic_id: number) => {
      const lesson = flatLessons.find((lesson_item) =>
        lesson_item?.topics?.find((topic) => topic.id === topic_id),
      );
      return lesson ? lesson.id : null;
    },
    [flatLessons],
  );

  const currentEditMode = useMemo<CurrentEditMode>(() => {
    if (l.query?.lesson) {
      return {
        mode: 'lesson',
        id: Number(l.query.lesson),
        value: flatLessons.find((lesson) => lesson.id === Number(l.query.lesson)),
      };
    }
    if (l.query?.topic) {
      return {
        mode: 'topic',
        id: Number(l.query.topic),
        value: flatTopics.find((t) => t.id === Number(l.query.topic)),
      };
    }
    return { mode: 'init' };
  }, [l.query, state, flatLessons, flatTopics]);

  const addNewLesson = useCallback(
    (parentId?: number) => {
      const newLesson: API.Lesson = {
        course_id: id,
        topics: [],
        isNew: true,
        id: state ? state.lessons.length + 1 : getRandomId(), // New Lesson
        order: 0,
        title: 'Add title here',
        active: true,
        parent_id: parentId,
      };

      setState((prevState) => ({
        ...prevState,
        lessons: recursiveAddLessonToLessons(prevState?.lessons ?? [], newLesson, parentId),
        //lessons: [...(prevState ? prevState.lessons : []), newLesson] as API.Lesson[],
      }));

      return newLesson;
    },
    [id, state],
  );

  const updateLesson = useCallback(
    (lesson_id: number, formData: FormData) => {
      const newLesson = flatLessons.find((lesson) => lesson.id === lesson_id);
      const isNew = newLesson && newLesson.isNew;

      return (isNew ? apiCreateLesson(formData) : apiUpdateLesson(lesson_id, formData)).then(
        (data) => {
          message.success(data.message);
          getLessons();
          return (
            data.success &&
            setState((prevState) => ({
              ...prevState,
              lessons: recursiveEditLesson(prevState?.lessons ?? [], lesson_id, {
                ...data.data,
                isNew: false,
              }),
              /*
              lessons: prevState?.lessons
                ? prevState.lessons.map((lesson) => {
                    if (lesson.id === lesson_id) {
                      return {
                        ...lesson,
                        ...data.data,
                        isNew: false,
                      };
                    }
                    return lesson;
                  })
                : [data.data],
                */
            }))
          );
        },
      );
    },
    [state],
  );

  //** TODO this function will not work with nested structure */

  const sortLesson = useCallback(
    (lesson_id: number, up: boolean = true) => {
      const cIndex = state?.lessons.findIndex((lesson) => lesson.id === lesson_id) || 0;

      const swapIndex = up ? cIndex - 1 : cIndex + 1;

      const lessons = state?.lessons.map((lesson, index, arr) => {
        const newLesson =
          // eslint-disable-next-line
          index == cIndex ? arr[swapIndex] : index == swapIndex ? arr[cIndex] : lesson;
        return {
          ...newLesson,
          order: index,
        };
      });

      setState((prevState) => ({
        ...prevState,
        lessons: lessons || [],
      }));

      const orders = lessons
        ?.filter((lesson) => !lesson.isNew)
        .map((lesson) => [lesson.id, lesson.order]);

      sort({ class: 'Lesson', orders, course_id: id }).then((response) => {
        if (response.success) {
          message.success(response.message);
        }
      });
    },
    [state, id],
  );

  const sortTopic = useCallback(
    (lesson_id: number, topic_id: number, up = true) => {
      const lesson = flatLessons.find((lesson_item) => lesson_item.id === lesson_id);

      const lIndex = lesson?.topics?.findIndex((topic) => topic.id === topic_id);

      if (lIndex === undefined || lIndex === -1) {
        return;
      }

      const swapIndex = up ? lIndex - 1 : lIndex + 1;

      const topics =
        lesson?.topics?.map((topic, index, arr) => {
          const newTopic =
            // eslint-disable-next-line
            index == lIndex ? arr[swapIndex] : index == swapIndex ? arr[lIndex] : topic;

          return {
            ...newTopic,
            order: index,
          };
        }) || [];

      setState((prevState) => ({
        ...prevState,
        lessons: prevState
          ? prevState.lessons.map((lesson_item) => {
              if (lesson_item.id === lesson_id) {
                return {
                  ...lesson_item,
                  topics,
                };
              }
              return lesson_item;
            })
          : [],
      }));
    },
    [state],
  );

  const updateTopicsOrder = useCallback(
    (lesson_id: number) => {
      const lesson = flatLessons.find((lesson_item) => lesson_item.id === lesson_id);
      const orders = lesson?.topics
        ?.filter((topic) => !topic.isNew)
        .map((topic) => [topic.id, topic.order]);

      sort({ class: 'Topic', orders, course_id: id }).then((response) => {
        if (response.success) {
          message.success(response.message);
        }
      });
    },
    [state, id],
  );

  const sortTopics = useCallback(
    (lesson_id: number, new_order: API.Topic[]) => {
      setState((prevState) => ({
        ...prevState,
        lessons: prevState
          ? prevState.lessons.map((lesson_item) => {
              if (lesson_item.id === lesson_id) {
                return {
                  ...lesson_item,
                  topics: new_order,
                };
              }
              return lesson_item;
            })
          : [],
      }));

      const orders = new_order.map((topic) => [topic.id, topic.order]);

      sort({ class: 'Topic', orders, course_id: id }).then((response) => {
        if (response.success) {
          message.success(response.message);
        }
      });
    },
    [state],
  );

  const deleteLesson = useCallback(
    (lesson_id: number) => {
      const lesson = flatLessons.find((lesson_item) => lesson_item.id === lesson_id);
      if (!lesson) {
        return;
      }
      const { isNew } = lesson;

      if (isNew) {
        setState((prevState) => ({
          ...prevState,
          lessons: recursiveDeleteLesson(prevState?.lessons ?? [], lesson_id),
        }));
      }

      apiRemoveLesson(lesson_id).then((data) => {
        if (data.success) {
          message.success(data.message);
          setState((prevState) => ({
            ...prevState,
            lessons: recursiveDeleteLesson(prevState?.lessons ?? [], lesson_id),
          }));
        }
      });
    },
    [state],
  );

  const updateTopic = useCallback(
    (topic_id: number, formData: FormData) => {
      const lesson_id = getLessonIdByTopicId(topic_id);

      const lesson = flatLessons.find((lesson_item) => lesson_item.id === lesson_id);

      const topic = lesson && lesson.topics?.find((topic_item) => topic_item.id === topic_id);

      const isNew = topic?.isNew;

      return (isNew ? apiCreateTopic(formData) : apiUpdateTopic(topic_id, formData)).then(
        (data) => {
          if (data.success) {
            message.success(data.message);
            getLessons();

            history.push(`/courses/list/${id}/program/?topic=${data.data.id}`);

            if (topic?.topicable_type === TopicType.Video) {
              setTimeout(() => {
                getLessons();
              }, 5000);
            }
          }
        },
      );
    },
    [getLessonIdByTopicId, state, getLessons],
  );

  const deleteTopic = useCallback(
    (topic_id: number) => {
      const lesson_id = getLessonIdByTopicId(topic_id);

      const lesson = flatLessons.find((lesson_item) => lesson_item.id === lesson_id);
      if (!lesson) {
        return;
      }

      const topic = flatTopics?.find((topic_item) => topic_item.id === topic_id);

      const isNew = topic?.isNew;
      if (isNew && !topic.topicable) {
        setState((prevState) => ({
          ...prevState,
          lessons: recursiveDeleteTopic(prevState?.lessons ?? [], topic_id),
        }));
      } else {
        apiRemoveTopic(topic_id).then((data) => {
          if (data.success) {
            message.success(data.message);
            setState((prevState) => ({
              ...prevState,
              lessons: recursiveDeleteTopic(prevState?.lessons ?? [], topic_id),
            }));
          }
        });

        // TODO call API to delete
        /**
         return API(`topic/delete/${id}`, token, 'POST')
        .then((response) => response.json())
        .then(() =>
          setState((prevState) => ({
            ...prevState,
            lessons: prevState.lessons.map((lesson) => {
              if (lesson.id == id) {
                return {
                  ...lesson,
                  topics: lesson.topics.filter((topic) => topic.id !== id),
                };
              }
              return lesson;
            }),
          })),
        );
         */
      }
    },
    [state, getLessonIdByTopicId],
  );

  /*
  const addResource = useCallback(
    (id, formData) => {
      const isNew = false;

      const id = getLessonByTopicId(id);

      return API(`topic/resource/save/${id}`, token, 'POST', formData)
        .then((response) => response.json())
        .then((data) =>
          setState((prevState) => ({
            ...prevState,
            lessons: prevState.lessons.map((lesson) => {
              if (lesson.id == id) {
                return {
                  ...lesson,
                  topics: lesson.topics.map((topic) => {
                    if (topic.id == id) {
                      return {
                        ...topic,
                        resources: [...topic.resources, data],
                      };
                    }
                    return topic;
                  }),
                };
              }
              return lesson;
            }),
          })),
        );
    },
    [state],
  );
  */

  /*
  const removeResource = useCallback(
    (resource_id) => {
      // resource/delete/{courseFiles}

      const id = getQuizIdByResourseId(resource_id);
      const id = getLessonByTopicId(id);

      return API(`topic/resource/delete/${resource_id}`, token, 'DELETE', null)
        .then((response) => response.json())
        .then(() =>
          setState((prevState) => ({
            ...prevState,
            lessons: prevState.lessons.map((lesson) => {
              if (lesson.id == id) {
                return {
                  ...lesson,
                  topics: lesson.topics.map((topic) => {
                    if (topic.id == id) {
                      return {
                        ...topic,
                        resources: topic.resources.filter(
                          (resource) => resource.id !== resource_id,
                        ),
                      };
                    }
                    return topic;
                  }),
                };
              }
              return lesson;
            }),
          })),
        );
    },
    [state],
  );
  */

  /*
  const updateH5P = useCallback(
    (id, h5p_id) => {
      const id = getLessonByTopicId(id);
      return API(`topic/h5p/save/${id}`, token, 'POST', getFormData({ media: h5p_id }))
        .then((response) => response.json())
        .then((data) =>
          setState((prevState) => ({
            ...prevState,
            lessons: prevState.lessons.map((lesson) => {
              if (lesson.id == id) {
                return {
                  ...lesson,
                  topics: lesson.topics.map((topic) => {
                    if (topic.id == id) {
                      return {
                        ...topic,
                        media: data,
                      };
                    }
                    return topic;
                  }),
                };
              }
              return lesson;
            }),
          })),
        );
    },
    [state],
  );
  */

  const addNewTopic = useCallback((lesson_id: number, type: API.TopicType) => {
    const newTopic: API.Topic = {
      lesson_id,
      isNew: true,
      id: getRandomId(),
      title: 'Add new title here',
      active: true,
      topicable_type: type,
    };

    setState((prevState) => ({
      ...prevState,
      lessons: recursiveAddTopicToLessons(prevState?.lessons ?? [], lesson_id, newTopic),
    }));
    return newTopic;
  }, []);

  const onTopicUploaded = (prevTopicId: number, info: UploadChangeParam) => {
    const lesson_id = getLessonIdByTopicId(prevTopicId);
    setState((prevState) => ({
      ...prevState,
      lessons: prevState
        ? prevState.lessons?.map((lesson) => {
            if (lesson.id === lesson_id) {
              return {
                ...lesson,
                topics: lesson.topics?.map((topic) => {
                  if (topic.id === prevTopicId) {
                    return info.file.response.data;
                  }
                  return topic;
                }),
              };
            }
            return lesson;
          })
        : [],
    }));
    // Update topic id in params after receiving from server
    history.push(`/courses/list/${id}/program/?topic=${info.file.response.data.id}`);
  };

  const cloneTopic = useCallback(
    (topic_id: number) => {
      return apiCloneTopic(topic_id).then((response) => {
        if (response.success) {
          message.success(response.message);
          const lesson_id = getLessonIdByTopicId(topic_id);

          setState((prevState) => ({
            ...prevState,
            lessons: prevState
              ? prevState.lessons?.map((lesson) => {
                  if (lesson.id === lesson_id) {
                    const topics = lesson.topics || [];
                    return {
                      ...lesson,
                      topics: [...topics, response.data] as API.Topic[],
                    };
                  }
                  return lesson;
                })
              : [],
          }));
        }
      });
    },
    [state, getLessonIdByTopicId],
  );

  const cloneLesson = useCallback((lesson_id: number) => {
    return apiCloneLesson(lesson_id).then((response) => {
      if (response.success) {
        message.success(response.message);

        setState((prevState) => ({
          ...prevState,
          lessons: prevState ? [...prevState.lessons, response.data] : [],
        }));
      }
    });
  }, []);

  const value = {
    state,
    h5ps,
    // token: credentials.token,
    id,
    addNewLesson,
    updateLesson,
    updateTopic,
    // addResource,
    // removeResource,
    deleteLesson,
    // updateH5P,
    sortLesson,
    addNewTopic,
    deleteTopic,
    sortTopic,
    sortTopics,
    updateTopicsOrder,
    onTopicUploaded,
    cloneTopic,
    cloneLesson,
    currentEditMode,
    getLessons,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};
