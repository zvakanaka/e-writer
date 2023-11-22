[![npm](https://img.shields.io/npm/v/e-writer/latest)](https://www.npmjs.com/package/e-writer)  

Creates an EPUB file from a JSON object.

```js
import writeEpub from 'e-writer';

await writeEpub({
  title: 'My Book',
  isbn: '1234567890123',
  outFileName: 'my-book.epub',
  coverImage: 'cover.jpg', // optional - if not supplied then `title` is used as cover 
  images: ['sunset.jpg'], // optional
  creator: 'John Doe',
  authorFirstname: 'John',
  authorSurname: 'Doe',
  chapters: [
    {
      title: 'Chapter 1',
      content: `Content of chapter 1.
<img id="sunset" src="images/sunset.jpg" alt="A great sunset" />`,
    },
    {
      title: 'Chapter 2',
      content: 'Content of chapter 2.',
    },
  ],
})
```

## Roadmap 
- [x] Images
  - [x] Custom cover image
- [x] Sections (sub-chapters)
- [ ] Custom CSS/fonts
- [ ] Output file as stream/buffer

## Thank You
[Matt Garrish's EPUB3 Samples](https://github.com/IDPF/epub3-samples/tree/main/30/accessible_epub_3)
