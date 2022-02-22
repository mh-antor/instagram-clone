import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from '@firebase/firestore';
import { async } from '@firebase/util';
import {
  BookmarkIcon,
  ChatIcon,
  DotsHorizontalIcon,
  EmojiHappyIcon,
  HeartIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/outline';
import { HeartIcon as HeartIconFilled } from '@heroicons/react/solid';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Moment from 'react-moment';
import { db } from '../firebase';

function Post({ id, username, userImg, img, caption }) {
  const { data: session } = useSession();
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState([]);
  const [hasLiked, setHasLiked] = useState([]);

  // get them comments from firestore
  useEffect(
    () =>
      onSnapshot(
        query(
          collection(db, 'posts', id, 'comments'),
          orderBy('timestamp', 'desc')
        ),
        (snapshot) => setComments(snapshot.docs)
      ),

    [db, id]
  );

  // get them likes from firestore
  useEffect(
    () =>
      onSnapshot(collection(db, 'posts', id, 'likes'), (snapshot) =>
        setLikes(snapshot.docs)
      ),
    [db, id]
  );

  // go through likes and check if the user id match the like id
  useEffect(
    () =>
      setHasLiked(
        likes.findIndex((like) => like.id === session?.user?.uid) !== -1
      ),
    [likes]
  );

  // store the likes on firestore posts, according to the unique user id
  const likePost = async () => {
    if (hasLiked) {
      await deleteDoc(doc(db, 'posts', id, 'likes', session.user.uid));
    } else {
      await setDoc(doc(db, 'posts', id, 'likes', session.user.uid), {
        username: session.user.username,
      });
    }
  };

  // post them comments to firestore
  const sendComment = async (e) => {
    e.preventDefault();

    const commentToSend = comment;
    setComment(' ');

    await addDoc(collection(db, 'posts', id, 'comments'), {
      comment: commentToSend,
      username: session.user.username,
      userImage: session.user.image,
      timestamp: serverTimestamp(),
    });
  };

  return (
    <section className='bg-white my-7 border rounded-sm'>
      {/* header */}
      <div className='flex items-center p-5'>
        <img
          src={userImg}
          alt=''
          className='h-12 w-12 rounded-full object-contain border p-1 mr-3'
        />
        <p className='flex-1 font-bold'>{username || 'antor'}</p>
        <DotsHorizontalIcon className='h-5' />
      </div>
      {/* img */}
      <img src={img} alt='post image' className='object-cover w-full ' />
      {/* btns */}
      {session && (
        <section className='flex justify-between items-center px-4 py-4'>
          <div className='flex space-x-4 '>
            {hasLiked ? (
              <HeartIconFilled
                onClick={likePost}
                className='btn text-red-600'
              />
            ) : (
              <HeartIcon onClick={likePost} className='btn' />
            )}
            <ChatIcon className='btn' />
            <PaperAirplaneIcon className='btn' />
          </div>
          <div>
            <BookmarkIcon className='btn' />
          </div>
        </section>
      )}
      {/* caption */}
      <p className='p-5 truncate'>
        {likes.length > 0 && (
          <p className='text-xs font-bold mb-1'>{likes.length} likes</p>
        )}
        <span className='font-bold mr-1'>{username}</span>
        {caption}
      </p>
      {/* comments */}
      {comments.length > 0 && (
        <section className='ml-10 h-20 overflow-y-scroll scrollbar-thumb-gray-500 scrollbar-thin'>
          {comments.map((comment) => (
            <div key={comment.id} className='flex items-center space-x-2 mb-3'>
              <img
                className='h-7 rounded-full'
                src={comment.data().userImage}
                alt=''
              />
              <p className='text-sm flex-1'>
                <span className='font-bold'>{comment.data().username}</span>{' '}
                {comment.data().comment}
              </p>
              <Moment className='pr-5 text-xs' fromNow>
                {comment.data().timestamp?.toDate()}
              </Moment>
            </div>
          ))}
        </section>
      )}

      {session && (
        <form className='flex items-center p-4'>
          <EmojiHappyIcon className='h-7' />
          <input
            type='text'
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className='border-none flex-1 focus:ring-0 outline-none'
            placeholder='Add a comment...'
          />
          <button
            type='submit'
            disabled={!comment.trim()}
            onClick={sendComment}
            className='font-semibold text-blue-400'
          >
            Post
          </button>
        </form>
      )}
    </section>
  );
}

export default Post;
