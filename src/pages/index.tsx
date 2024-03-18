import { Button, CopyButton, Flex, Group, List, Paper, ScrollArea, Select, Stack, TextInput } from '@mantine/core';
import { useInputState } from '@mantine/hooks';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { api } from '~/utils/api';

const QUALITIES = [
  { value: '1', label: '360p' },
  { value: '2', label: '480p' },
  { value: '3', label: '720p' },
  { value: '4', label: '1080p' },
];

export default function Home() {
  const [anime, setAnime] = useInputState('');
  const [fetchLinks, setFetchLinks] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quality, setQuality] = useState<string | null>('3');

  const { data: animeData } = api.scrape.getSite.useQuery(
    { anime, quality },
    {
      enabled: fetchLinks,
      onSuccess() {
        setFetchLinks(false);
        setLoading(false);
      },
    }
  );

  const handleFetch = () => {
    setLoading(true);
    setFetchLinks(true);
  };

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name='description' content='Generated by create-t3-app' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <main>
        <Stack>
          <h2>
            Enter <span style={{ fontWeight: '1000' }}> Anime name </span> from{' '}
            <a href='https://animeblkom.com/'>Anime Blkom</a>
          </h2>
          <Flex justify='space-between'>
            <TextInput w='90%' value={anime} onChange={setAnime} />
            <Select w='120px' data={QUALITIES} value={quality} onChange={setQuality} />
          </Flex>
          <Button type='button' loading={loading} onClick={handleFetch}>
            Submit
          </Button>
          <Paper shadow='lg' radius='md' p='md' withBorder>
            <ScrollArea h={400}>
              <Flex direction='row' justify='space-between'>
                <List type='ordered'>
                  {animeData?.downloadLinks.map((downloadLink, idx) => (
                    <List.Item key={idx}>{downloadLink}</List.Item>
                  ))}
                </List>
                {animeData && (
                  <CopyButton value={JSON.stringify(animeData.downloadLinks)}>
                    {({ copied, copy }) => (
                      <Button color={copied ? 'teal' : 'blue'} onClick={copy}>
                        {copied ? 'Copied links' : 'Copy links'}
                      </Button>
                    )}
                  </CopyButton>
                )}
              </Flex>
            </ScrollArea>
          </Paper>
        </Stack>
      </main>
    </>
  );
}

// export const getServerSideProps: GetServerSideProps = async () => {
//   const res = await fetch('https://api.github.com/repos/vercel/next.js');
//   const repo = await res.json();
//   return { props: { repo } };
// };
