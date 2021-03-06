import Prismic from '@prismicio/client';
import Head from 'next/head';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import React from 'react';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { Comments } from '../../components/Comments';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  uid: string;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

type pageInfo = {
  uid: string;
  data: {
    title: string;
  };
};

interface PostProps {
  post: Post;
  preview: boolean;
  nextPage: pageInfo;
  previousPage: pageInfo;
}

export default function Post({
  post,
  preview,
  nextPage,
  previousPage,
}: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <div style={{ margin: 'auto auto' }}>Carregando...</div>;
  }

  const readTime = post.data.content.reduce((total, content) => {
    const bodyWords = RichText.asText(content.body).split(' ').length;

    return total + bodyWords;
  }, 0);

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>
      <Header />

      <main className={styles.postContainer}>
        <img src={post.data.banner.url} alt="banner" />
        <section>
          <h1>{post.data.title}</h1>
          <div className={commonStyles.containerAuthor}>
            <FiCalendar />
            <time>
              {post.first_publication_date
                ? format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                    locale: ptBR,
                  })
                : 'Preview'}
            </time>
            <FiUser /> <span>{post.data.author}</span>
            <FiClock />
            <span>{Math.ceil(readTime / 200)} min</span>
          </div>

          {post.last_publication_date && (
            <div className={styles.isUpdated}>
              <span>
                {`* editado em ${format(
                  new Date(post.last_publication_date),
                  'dd MMM yyyy',
                  {
                    locale: ptBR,
                  }
                )}, ??s ${format(new Date(post.last_publication_date), 'HH:MM', {
                  locale: ptBR,
                })}`}
              </span>
            </div>
          )}

          {post.data.content.map(content => (
            <article key={`${content.heading}`}>
              <h1 className={styles.headinContent}>{content.heading}</h1>
              <div
                className={styles.content}
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </article>
          ))}

          <div className={styles.divider} />

          <footer>
            <header>
              <div>
                {previousPage ? (
                  <span>
                    {previousPage.data.title}
                    <Link href={`/post/${previousPage.uid}`}>
                      <a className={commonStyles.highlightButton} type="button">
                        Post anterior
                      </a>
                    </Link>
                  </span>
                ) : (
                  <span />
                )}
                {nextPage ? (
                  <span>
                    {nextPage?.data.title}
                    <Link href={`/post/${nextPage.uid}`}>
                      <a className={commonStyles.highlightButton} type="button">
                        Pr??ximo post
                      </a>
                    </Link>
                  </span>
                ) : (
                  <span />
                )}
              </div>
            </header>
            <Comments />

            {preview && (
              <Link href="/api/exit-preview">
                <button type="button" className={commonStyles.previewButton}>
                  Sair do modo preview
                </button>
              </Link>
            )}
          </footer>
        </section>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts'),
  ]);

  const allPosts = [];

  posts.results.map(post => {
    return allPosts.push({ params: { slug: post.uid } });
  });

  return {
    paths: allPosts,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref || null,
  });

  const prevpost = (
    await prismic.query(Prismic.predicates.at('document.type', 'posts'), {
      pageSize: 1,
      after: `${response?.id}`,
      orderings: '[document.last_publication_date desc]',
    })
  ).results[0];

  const nextpost = (
    await prismic.query(Prismic.predicates.at('document.type', 'posts'), {
      pageSize: 1,
      after: `${response?.id}`,
      orderings: '[document.last_publication_date]',
    })
  ).results[0];

  const post: Post = {
    first_publication_date: response?.first_publication_date,
    last_publication_date: response?.last_publication_date,
    uid: response?.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(item => {
        return {
          heading: item.heading,
          body: [...item.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
      preview,
      nextPage: prevpost || null,
      previousPage: nextpost || null,
    },
    revalidate: 60 * 60 * 24, // 24 hours
  };
};
