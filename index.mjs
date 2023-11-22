import { $, cd, fs, path } from 'zx'

export default async function write(options) {
  const date = new Date()

  // overridden if supplied
  const defaultOptions = {
    outFileName: 'out.epub',
    isoDateString: date.toISOString(),
    isoDateStringShort: date.toISOString().split('T')[0],
  }

  const sampleImages = ['sunset.jpg'];
  const sampleEpub = {
    outFileName: 'example.epub',
    title: 'Example Title',
    isbn: null,
    creator: 'John Doe',
    authorFirstname: 'John',
    authorSurname: 'Doe',
    coverImage: 'cover.jpg',
    images: sampleImages,
    chapters: [
      {
        title: 'Chapter 1',
        content: `<p>Chapter 1 content</p>`,
        sections: [
          {
            title: 'Section 1.1',
            content: `<div>
  <p>Section 1.1 content</p>
  <figure class="figure-float" id="${fileWithoutExtension(sampleImages[0])}-figure">
    <img id="${fileWithoutExtension(sampleImages[0])}" src="images/${sampleImages[0]}" alt="A great sunset" />
    <figcaption class="title">He paints a new one every day</figcaption>
  </figure>
</div>
`,
          },
          {
            title: 'Section 1.2',
            content: '<p>Section 1.2 content</p>',
          },
        ]
      },
      {
        title: 'Chapter 2',
        content: `<p>Chapter 2 content</p>`,
      },
    ]
  }

  const epub = {
    ...defaultOptions,
    ...(typeof options !== 'undefined' ? options : sampleEpub)
  }

  await $`rm -rf temp_epub_writer`

  await $`mkdir temp_epub_writer`
  cd(`temp_epub_writer`)

  await $`echo -n 'application/epub+zip' > mimetype`

  await $`mkdir META-INF`
  const str = `<?xml version="1.0" encoding="utf-8" standalone="no"?>
<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
	<rootfiles>
		<rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/>
	</rootfiles>
</container>`
  await fs.writeFile(`META-INF/container.xml`, str)

  await $`mkdir EPUB`

  await placeImages(epub)
  writeToc(epub)
  writeOpf(epub)
  writeCover(epub)
  writeIndex(epub)
  epub?.chapters?.forEach((chapter, i) => {
    writeChapter(epub, chapter, i)
  })

  await $`zip -X0 ../temp.epub mimetype`
  await $`zip -Xr ../temp.epub META-INF/ EPUB/`
  cd(`..`)
  await $`mv temp.epub ${epub.outFileName}`
  await $`rm -rf temp_epub_writer`
}

function padNumber(str) {
  return String(str).padStart(4, '0')
}

async function placeImages(epub) {
  if (epub.coverImage) {
    fs.mkdirSync('EPUB/covers');
    await $`cp '../${epub.coverImage}' EPUB/covers/`;
  }
  if (Array.isArray(epub.images) && epub.images.length > 0) {
    const fileNames = epub.images;
    fs.mkdirSync('EPUB/images');
    await fileNames.forEach(async (fileName) => {
      await $`cp '../${fileName}' EPUB/images/`
    })
  }
}
function writeToc(epub) {
  const str = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
  <!DOCTYPE html>
  <html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en"
    lang="en">
    <head>
      <title>${epub.title}</title>
    </head>
    <body>
    <h1>${epub.title}</h1>
    <nav epub:type="toc" id="toc" role="doc-toc">
        <h2>Table of Contents</h2>
        <ol>
          ${epub.chapters.map((chapter, i) => {
    return `<li><a href="ch${padNumber(i + 1)}.xhtml">${chapter.title}</a></li>
            <ol>
            ${chapter?.sections?.map((section, j) => {
      return `<li><a href="ch${padNumber(i + 1)}.xhtml#s${padNumber(j + 1)}">${section.title}</a></li>`
    }).join('') || ''}
            </ol>`
  }).join('')}
        </ol>
      </nav>
    </body>
  </html>`
  fs.writeFileSync('EPUB/toc.xhtml', str)
}

function writeOpf(epub) {
  const str = `<?xml version="1.0" encoding="utf-8" standalone="no"?>
<package xmlns="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/"
	xmlns:dcterms="http://purl.org/dc/terms/" version="3.0" xml:lang="en"
	unique-identifier="pub-identifier">
  <metadata>
    <dc:identifier id="pub-identifier">urn:isbn:${epub.isbn}</dc:identifier>
    <dc:title id="pub-title">${epub.title}</dc:title>
    <dc:language id="pub-language">${epub.language || 'en'}</dc:language>
    <dc:date>${epub.isoDateStringShort}</dc:date>
    <meta property="dcterms:modified">${epub.isoDateString}</meta>
    <dc:creator id="pub-creator">${epub.creator}</dc:creator>
    ${epub.publisher ? `<dc:publisher>${epub.publisher}</dc:publisher>` : ''}
    ${epub.copyright ? `<dc:rights>${epub.copyright}</dc:rights>` : ''}
    <meta property="schema:accessMode">textual</meta>
    <meta property="schema:accessMode">visual</meta>
    <meta property="schema:accessModeSufficient">textual,visual</meta>
    <meta property="schema:accessModeSufficient">textual</meta>
  </metadata>
  <manifest>
    <item id="htmltoc" properties="nav" media-type="application/xhtml+xml" href="toc.xhtml"/>
    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>
    ${epub.coverImage ? `
    <item id="cover-image" properties="cover-image" href="covers/${epub.coverImage}" media-type="${getMediaType(epub.coverImage)}"/>` : ''}
    <item id="id-index" href="index.xhtml" media-type="application/xhtml+xml"/>
    ${epub.chapters.map((_, i) => {
      return `<item id="id-ch${padNumber(i + 1)}" href="ch${padNumber(i + 1)}.xhtml" media-type="application/xhtml+xml"/>`
    }).join('\n')}
    ${epub.images.map((image, i) => {
      return `<item id="${fileWithoutExtension(image)}" href="images/${image}" media-type="${getMediaType(image)}"/>`
    }).join('\n')}
  </manifest>
  <spine>
		<itemref idref="cover" linear="no" />
		<itemref idref="id-index" />
		<itemref idref="htmltoc" linear="yes" />
    ${epub.chapters.map((_, i) => {
    return `<itemref idref="id-ch${padNumber(i + 1)}" />`
  }).join('')}
	</spine>
</package>`
  fs.writeFileSync('EPUB/package.opf', str)
}

function writeCover(epub) {
  const str = `<?xml version="1.0" encoding="utf-8" standalone="no"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
	<head>
		<title>Cover</title>
		<style type="text/css">
			img{
				max-width:100%;
			}
		</style>
	</head>
	<body>
    ${epub.coverImage ?
    `
    <figure id="cover-image">
			<img role="doc-cover" src="covers/${epub.coverImage}" alt="${epub.title}" />
		</figure>` : epub.title}
	</body>
</html>`
  fs.writeFileSync('EPUB/cover.xhtml', str)
}

function writeIndex(epub) {
  const str = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
  <!DOCTYPE html>
  <html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
    <head>
      <title>${epub.title}</title>
    </head>
    <body>
      <section class="book" id="I_book_index">
        <h1 class="title">${epub.title}</h1>
        <div class="author"><span class="firstname">${epub.authorFirstname}</span> <span class="surname">${epub.authorSurname}</span></div>
        <hr />
      </section>
    </body>
  </html>`
  fs.writeFileSync('EPUB/index.xhtml', str)
}

function writeChapter(epub, chapter, i) {
  const str = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
  <!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
<head>
  <title>${chapter.title}</title>
</head>
<body>
<section class="chapter" epub:type="chapter" role="doc-chapter" aria-labelledby="c${i + 1}_h" id="id-ch${padNumber(i + 1)}">
  <h1 class="chapter-title" id="c${i + 1}_h">${chapter.title}</h1>
    ${chapter.content}
    ${chapter?.sections?.map((section, j) => {
    return `<section class="section" epub:type="section" role="doc-section" id="s${padNumber(j + 1)}">
        <h2 class="section-title" id="s${padNumber(j + 1)}_h">${section.title}</h2>
        <p>${section.content}</p>
      </section>`
  }).join('') || ''}
</section>
</body>
</html>`
  fs.writeFileSync(`EPUB/ch${padNumber(i + 1)}.xhtml`, str)
}

function fileWithoutExtension(fileName) {
  if (!fileName.includes('.')) {
    return fileName
  }
  return fileName
    .split('.')
    .filter((_, i, arr) => i !== arr.length - 1)
    .join('.')
}

function getMediaType(fileName) {
  if (!fileName.includes('.')) {
    console.warn(`No file extension found for: '${fileName}'`)
    return ''
  }
  switch (fileName.split('.')[fileName.split('.').length - 1].toLowerCase()) {
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    default:
      console.warn(`Unhandled file extension for: '${fileName}'`)
      return ''
  }
} 
