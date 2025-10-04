from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.app.db import get_db
from backend.app.models import Book
from backend.app.schemas import BookCreate, BookUpdate, BookResponse

router = APIRouter(prefix="/books", tags=["books"])


@router.get("/", response_model=List[BookResponse])
async def get_books(db: Session = Depends(get_db)):
    """모든 도서 조회"""
    books = db.query(Book).all()
    return books


@router.get("/{book_id}", response_model=BookResponse)
async def get_book(book_id: int, db: Session = Depends(get_db)):
    """특정 도서 조회"""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="도서를 찾을 수 없습니다")
    return book


@router.post("/", response_model=BookResponse, status_code=201)
async def create_book(book: BookCreate, db: Session = Depends(get_db)):
    """새 도서 등록"""
    from backend.app.models import Collection

    # 컬렉션 존재 확인
    collection = db.query(Collection).filter(Collection.id == book.collection_id).first()
    if not collection:
        raise HTTPException(status_code=404, detail="컬렉션을 찾을 수 없습니다")

    # ISBN 중복 체크
    if book.isbn:
        existing = db.query(Book).filter(Book.isbn == book.isbn).first()
        if existing:
            raise HTTPException(status_code=400, detail="이미 등록된 ISBN입니다")

    db_book = Book(**book.model_dump())
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book


@router.put("/{book_id}", response_model=BookResponse)
async def update_book(book_id: int, book: BookUpdate, db: Session = Depends(get_db)):
    """도서 정보 수정"""
    from backend.app.models import Collection

    db_book = db.query(Book).filter(Book.id == book_id).first()
    if not db_book:
        raise HTTPException(status_code=404, detail="도서를 찾을 수 없습니다")

    update_data = book.model_dump(exclude_unset=True)

    # 컬렉션 변경 시 존재 확인
    if "collection_id" in update_data:
        collection = db.query(Collection).filter(Collection.id == update_data["collection_id"]).first()
        if not collection:
            raise HTTPException(status_code=404, detail="컬렉션을 찾을 수 없습니다")

    # ISBN 중복 체크
    if "isbn" in update_data and update_data["isbn"]:
        existing = db.query(Book).filter(
            Book.isbn == update_data["isbn"], Book.id != book_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="이미 등록된 ISBN입니다")

    for key, value in update_data.items():
        setattr(db_book, key, value)

    db.commit()
    db.refresh(db_book)
    return db_book


@router.delete("/{book_id}", status_code=204)
async def delete_book(book_id: int, db: Session = Depends(get_db)):
    """도서 삭제"""
    db_book = db.query(Book).filter(Book.id == book_id).first()
    if not db_book:
        raise HTTPException(status_code=404, detail="도서를 찾을 수 없습니다")

    db.delete(db_book)
    db.commit()
    return None
