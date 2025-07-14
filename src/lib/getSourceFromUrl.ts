type ArticleSource = {
    name: string;
    favicon?: string;
    fallbackThumbnail?: string;
  }
  
  export const SOURCE_MAP: Record<string, ArticleSource> = {
    "toss.tech": {
      name: "토스",
      favicon: "https://static.toss.im/tds/favicon/favicon-16x16.png"
    },
    "tech.kakaopay.com": {
      name: "카카오페이",
      favicon: "https://tech.kakaopay.com/favicon.ico"
    },
    "engineering.ab180.co": {
      name: "AB180",
      favicon: "https://oopy.lazyrockets.com/api/rest/cdn/image/7bbc75b5-1cdf-4b59-aec4-af3e335b3aad.png?d=16"
    },
    "thefarmersfront.github.io": {
      name: "컬리",
      favicon: "https://www.kurly.com/favicon.ico"
    },
    "tech.devsisters.com": {
      name: "데브시스터스",
      favicon: "https://tech.devsisters.com/favicon-32x32.png"
    },
    "tech.socarcorp.kr": {
      name: "쏘카",
      favicon: "https://tech.socarcorp.kr/assets/icon/favicon.ico"
    },
    "hyperconnect.github.io": {
      name: "하이퍼커넥트",
      favicon: "https://hyperconnect.github.io/assets/favicon.svg"
    },
    "tech.kakao.com": {
      name: "카카오",
      favicon: "https://tech.kakao.com/favicon.ico"
    },
    "d2.naver.com": {
      name: "네이버 D2",
      favicon: "https://d2.naver.com/favicon.ico",
      fallbackThumbnail: "https://d2.naver.com/static/img/app/d2_logo_renewal.png"
    },
    "techblog.lycorp.co.jp": {
      name: "라인",
      favicon: "https://techblog.lycorp.co.jp/favicon.ico"
    },
    "tech.inflab.com": {
      name: "인프랩",
      favicon: "https://tech.inflab.com/favicon-32x32.png"
    },
    "blog.banksalad.com": {
      name: "뱅크샐러드",
      favicon: "https://blog.banksalad.com/favicon-32x32.png"
    },
    "danawalab.github.io": {
      name: "다나와",
      favicon: "https://img.danawa.com/new/danawa_main/v1/img/danawa_favicon.ico"
    },
    "medium.com/musinsa-tech": {
      name: "무신사",
      favicon: "https://miro.medium.com/v2/1*Qs-0adxK8doDYyzZXMXkmg.png"
    },
    "medium.com/miridih": {
      name: "미리디",
      favicon: "https://miro.medium.com/v2/1*uNdurJkcAe2-UoseF_dxrQ.png"
    },
    "medium.com/daangn": {
      name: "당근",
      favicon: "https://miro.medium.com/v2/resize:fill:76:76/1*Bm8_nGjfNiKV0PASwiPELg.png"
    }
  }

export const getSourceFromUrl = (url: string): ArticleSource => {
    try {
      const hostname = new URL(url).hostname;
      const subDomainName = hostname.split(".")[0];
      const author = url.split("/")[3];
      
      if (SOURCE_MAP[hostname]) {
        return SOURCE_MAP[hostname];
      } else if (SOURCE_MAP[`${hostname}/${author}`]) {
        return SOURCE_MAP[`${hostname}/${author}`];
      }
      
      switch (true) {
        case hostname.includes("tistory.com"): {
          return {
            name: `tistory.com > ${subDomainName}`
          }
        }
        case hostname.includes("github.io"): {
          return {
            name: `github.io > ${subDomainName}`
          }
        }
        case hostname.includes("medium.com"): {
          return {
            name: `medium.com > ${author}`
          }
        }
        case hostname.includes("dev.to"): {
          return {
            name: `dev.to > ${author}`
          }
        }
        case hostname.includes("velog.io"): {
          return {
            name: `velog.io > ${author}`
          }
        }
        default: {
          return {
            name: hostname
          }
        }
      }
    } catch (error) {
      console.error("Error parsing URL:", error);
      return {
        name: url
      }
    }
  }