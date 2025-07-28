남산분원 제1전시실 퀴즈 CSV 입력 가이드
====================================

이 파일은 quiz1.csv 파일을 작성할 때 참고할 수 있는 안내서입니다.

1. 기본 구조
----------------
- 첫 번째 줄(헤더)에 각 컬럼의 이름이 들어갑니다.
- 두 번째 줄부터 각 퀴즈 한 문제씩 입력합니다.

2. 주요 컬럼 설명
-------------------
- id: 문제 고유 번호(숫자)
- type: 문제 유형 (single, singleimg, text, matrix 등)
- question_text: 문제 설명(텍스트)
- question_img: 문제에 들어갈 이미지 파일 경로(없으면 비워둠)
- choice1_text ~ choice5_text: 객관식 보기 텍스트(최대 5개)
- choice1_img ~ choice5_img: 객관식 보기 이미지 경로(최대 5개)
- row1, row2, row3: 행렬형(matrix) 문제에서 행 이름
- col1, col2, col3, col4: 행렬형(matrix) 문제에서 열 이름
- answer_row1, answer_row2, answer_row3: 행렬형(matrix) 문제에서 각 행의 정답
- answer: 정답(객관식/주관식/이미지 등)
- explanation: 해설(정답 확인 후 보여줄 설명)

3. 문제 유형별 입력 예시
--------------------------

① 객관식(이미지 선택) 문제
---------------------------
id,type,question_text,question_img,choice1_text,choice1_img,choice2_text,choice2_img,choice3_text,choice3_img,choice4_text,choice4_img,choice5_text,choice5_img,answer,explanation
1,singleimg,이 중에서 정답을 고르세요.,, ,img1.png, ,img2.png, ,img3.png,,,,,img2.png,"2번 이미지가 정답입니다."

② 객관식(텍스트 선택) 문제
---------------------------
id,type,question_text,question_img,choice1_text,choice1_img,choice2_text,choice2_img,choice3_text,choice3_img,choice4_text,choice4_img,choice5_text,choice5_img,answer,explanation
2,single,정답을 고르세요.,,,보기1,,,,보기2,,,,보기3,,,,보기2,"2번이 정답입니다."

③ 주관식(텍스트 입력) 문제
---------------------------
id,type,question_text,question_img,answer,explanation
3,text,정답을 입력하세요.,,정답1|정답2|정답3,"여러 답 중 하나를 입력하면 정답 처리됩니다."

④ 행렬형(matrix) 문제
----------------------
id,type,question_text,question_img,row1,row2,row3,col1,col2,col3,answer_row1,answer_row2,answer_row3,explanation
4,matrix,아래에서 해당하는 것을 고르세요.,,,행1,행2,행3,열1,열2,열3,정답1,정답2,정답3,"각 행의 정답을 맞추면 정답 처리됩니다."

4. 주의사항
-------------
- 이미지 파일 경로는 data/01/ 폴더 기준으로 작성하세요.
- 빈 칸이 필요한 경우 ,(쉼표)만 입력하여 비워둡니다.
- 정답이 여러 개인 경우 |(파이프)로 구분합니다.
- 해설(explanation)은 선택 사항입니다.

5. 참고
---------
- 실제 예시는 quiz1.csv 파일을 참고하세요.
- 문제 유형(type)과 컬럼 조합은 js/quiz-loader.js의 구현에 따라 달라질 수 있습니다. 